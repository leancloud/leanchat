import { OnModuleInit, UsePipes } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { ZodValidationPipe } from 'nestjs-zod';
import _ from 'lodash';

import { ConfigService } from 'src/config';
import { InviteEvaluationEvent } from 'src/event';
import {
  Channel,
  ChatService,
  Conversation,
  ConversationCreatedEvent,
  ConversationService,
  ConversationStatus,
  ConversationUpdatedEvent,
  Message,
  MessageCreatedEvent,
  MessageData,
  MessageService,
  MessageType,
  UserType,
  VisitorService,
} from 'src/chat';
import { LeanCloudService } from 'src/leancloud';
import { CreateMessageDto } from './dtos/create-message.dto';
import { EvaluationDto } from './dtos/evaluation.dto';
import { VisitorChannelService } from './visitor-channel.service';
import { MessageDto } from './dtos/message.dto';
import { ConversationDto } from './dtos/conversation.dto';
import { WidgetInitialized } from './interfaces';

const visitorMessageTypes = [
  MessageType.Message,
  MessageType.Evaluate,
  MessageType.Close,
  MessageType.Reopen,
];

@WebSocketGateway()
@UsePipes(ZodValidationPipe)
export class VisitorGateway implements OnModuleInit, OnGatewayConnection {
  @WebSocketServer()
  private server: Server;

  constructor(
    private chatService: ChatService,
    private widgetService: VisitorChannelService,
    private visitorService: VisitorService,
    private conversationService: ConversationService,
    private messageService: MessageService,
    private configService: ConfigService,
    private leancloudService: LeanCloudService,
  ) {}

  onModuleInit() {
    this.server.use(async (socket, next) => {
      let { token } = socket.handshake.auth;

      if (token) {
        if (typeof token !== 'string') {
          return next(new Error('Invalid token'));
        }
        const result = this.widgetService.validateToken(token);
        if (result) {
          socket.data.id = result.id;
          return next();
        }
      }

      const visitor = await this.visitorService.createVisitor();
      token = this.widgetService.createToken(visitor.id);
      socket.emit('signedUp', { token });
      socket.data.id = visitor.id;
      next();
    });
  }

  async handleConnection(socket: Socket) {
    const visitorId = socket.data.id;
    socket.join(visitorId);

    const initData: WidgetInitialized = {
      status: 'online',
      messages: [],
    };

    const queueConfig = await this.configService.get('queue');
    if (queueConfig?.capacity) {
      const queueLength = await this.chatService.getQueueLength();
      if (queueLength > queueConfig.capacity) {
        initData.status = 'busy';
        initData.messages.push(
          MessageDto.fromText('busy', queueConfig.fullMessage.text),
        );
        socket.emit('initialized', initData);
        socket.disconnect();
        return;
      }
    }

    if (!(await this.chatService.hasReadyOperator())) {
      initData.status = 'offline';
      const noReadyOperatorMessageConfig = await this.configService.get(
        'noReadyOperatorMessage',
      );
      if (noReadyOperatorMessageConfig) {
        initData.messages.push(
          MessageDto.fromText(
            'noReadyOperator',
            noReadyOperatorMessageConfig.text,
          ),
        );
      }
      socket.emit('initialized', initData);
      socket.disconnect();
      return;
    }

    const visitor = await this.visitorService.getVisitor(visitorId);
    if (visitor && visitor.currentConversationId) {
      const conversation = await this.conversationService.getConversation(
        visitor.currentConversationId.toString(),
      );
      if (conversation) {
        initData.conversation = ConversationDto.fromDocument(conversation);
      }
    }

    const messageCount = 25;
    const messages = await this.messageService.getMessages({
      visitorId,
      type: visitorMessageTypes,
      desc: true,
      limit: messageCount,
    });
    initData.messages = messages.reverse().map(MessageDto.fromDocument);

    if (messages.length < messageCount) {
      const greetingMessage = await this.configService.get('greetingMessage');
      if (greetingMessage?.enabled) {
        initData.messages.unshift(
          MessageDto.fromText('greeting', greetingMessage.text),
        );
      }
    }

    const evaluationConfig = await this.configService.get('evaluation');
    if (evaluationConfig) {
      initData.evaluationTag = evaluationConfig.tag;
    }

    socket.emit('initialized', initData);
  }

  @SubscribeMessage('message')
  async handleIncommingMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: CreateMessageDto,
  ) {
    const visitorId = socket.data.id;
    const visitor = await this.visitorService.getVisitor(visitorId);
    if (!visitor) {
      // TODO: throw an error
      return;
    }

    let conversation: Conversation | null | undefined;
    if (visitor.currentConversationId) {
      conversation = await this.conversationService.getConversation(
        visitor.currentConversationId.toString(),
      );
    }
    if (!conversation || conversation.status === ConversationStatus.Closed) {
      const isBusy = await this.widgetService.isBusy();
      if (isBusy) {
        return;
      }

      conversation = await this.conversationService.createConversation({
        channel: Channel.LiveChat,
        visitorId,
      });
      await this.visitorService.updateVisitor(visitorId, {
        currentConversationId: conversation.id,
      });
    }

    const messageData: MessageData = {};
    if (data.text) {
      messageData.text = data.text;
    } else if (data.fileId) {
      const file = await this.leancloudService.getFile(data.fileId);
      if (file) {
        messageData.file = file;
      }
    }

    if (_.isEmpty(messageData)) {
      return;
    }

    await this.chatService.createMessage({
      conversationId: conversation.id,
      from: {
        type: UserType.Visitor,
        id: visitorId,
      },
      data: messageData,
    });
  }

  @SubscribeMessage('evaluate')
  async handleEvaluate(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: EvaluationDto,
  ) {
    const visitorId = socket.data.id;
    const visitor = await this.visitorService.getVisitor(visitorId);
    if (!visitor || !visitor.currentConversationId) {
      return;
    }

    const conversation = await this.conversationService.getConversation(
      visitor.currentConversationId.toString(),
    );
    if (!conversation || conversation.evaluation) {
      return;
    }

    await this.chatService.evaluateConversation(conversation.id, data);
  }

  @SubscribeMessage('close')
  async handleClose(@ConnectedSocket() socket: Socket) {
    const visitorId = socket.data.id;
    const visitor = await this.visitorService.getVisitor(visitorId);
    if (!visitor || !visitor.currentConversationId) {
      return;
    }

    await this.chatService.closeConversation({
      conversationId: visitor.currentConversationId,
      by: {
        type: UserType.Visitor,
        id: visitorId,
      },
    });
  }

  shouldPublishMessage(message: Message) {
    return visitorMessageTypes.some((type) => message.type === type);
  }

  @OnEvent('conversation.created', { async: true })
  publishConversationCreated(payload: ConversationCreatedEvent) {
    this.server
      .to(payload.conversation.visitorId.toString())
      .emit(
        'currentConversation',
        ConversationDto.fromDocument(payload.conversation),
      );
  }

  @OnEvent('conversation.updated', { async: true })
  publishConversationUpdated(payload: ConversationUpdatedEvent) {
    if (payload.data.evaluation || payload.data.status) {
      this.server
        .to(payload.conversation.visitorId.toString())
        .emit(
          'currentConversation',
          ConversationDto.fromDocument(payload.conversation),
        );
    }
  }

  @OnEvent('message.created', { async: true })
  publishMessage(payload: MessageCreatedEvent) {
    const { message } = payload;
    if (this.shouldPublishMessage(message)) {
      this.server
        .to(message.visitorId.toString())
        .emit('message', MessageDto.fromDocument(message));
    }
  }

  @OnEvent('inviteEvaluation', { async: true })
  publishEvaluationInvitation(payload: InviteEvaluationEvent) {
    const { conversation } = payload;
    const visitorId = conversation.visitorId.toString();
    this.server.to(visitorId).emit('inviteEvaluation', {
      conversationId: conversation.id,
    });
  }
}
