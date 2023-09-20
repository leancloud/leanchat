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

import { ConfigService } from 'src/config';
import { InviteEvaluationEvent } from 'src/event';
import {
  ChatService,
  Conversation,
  ConversationCreatedEvent,
  ConversationService,
  Message,
  MessageCreatedEvent,
  MessageService,
  VisitorService,
} from 'src/chat';
import { CreateMessageDto } from './dtos/create-message.dto';
import { EvaluationDto } from './dtos/evaluation.dto';
import { VisitorChannelService } from './visitor-channel.service';
import { MessageDto } from './dtos/message.dto';
import { ConversationDto } from './dtos/conversation.dto';
import { WidgetInitialized } from './interfaces';

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
  ) {}

  onModuleInit() {
    this.server.use(async (socket, next) => {
      const { token } = socket.handshake.auth;

      if (token) {
        if (typeof token !== 'string') {
          return next(new Error('Invalid token'));
        }
        const result = this.widgetService.validateToken(token);
        if (!result) {
          return next(new Error('Invalid token'));
        }
        socket.data.id = result.id;
      } else {
        const visitor = await this.visitorService.createVisitor();
        const token = this.widgetService.createToken(visitor.id);
        socket.emit('signedUp', { token });
        socket.data.id = visitor.id;
      }

      next();
    });
  }

  async handleConnection(socket: Socket) {
    const visitorId = socket.data.id;
    socket.join(visitorId);

    const initData: WidgetInitialized = {};

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
      type: ['message', 'evaluate'],
      desc: true,
      limit: messageCount,
    });
    initData.messages = messages.reverse().map(MessageDto.fromDocument);

    if (messages.length < messageCount) {
      const greeting = await this.configService.getGreetingConfig();
      if (greeting && greeting.enabled) {
        initData.messages.unshift(
          MessageDto.fromText('greeting', greeting.message.text),
        );
      }
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
      return;
    }

    let conversation: Conversation | null | undefined;
    if (visitor.currentConversationId) {
      conversation = await this.conversationService.getConversation(
        visitor.currentConversationId.toString(),
      );
    }
    if (!conversation || conversation.closedAt) {
      conversation = await this.conversationService.createConversation({
        channel: 'widget',
        visitorId,
      });
      await this.visitorService.updateVisitor(visitorId, {
        currentVisitorId: conversation.id,
      });
    }
    await this.chatService.createMessage({
      conversationId: conversation.id,
      from: {
        type: 'visitor',
        id: visitorId,
      },
      data,
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

  shouldDispatchMessage(message: Message) {
    return message.type === 'message' || message.type === 'evaluate';
  }

  @OnEvent('conversation.created', { async: true })
  dispatchConversationCreated(payload: ConversationCreatedEvent) {
    this.server
      .to(payload.conversation.visitorId.toString())
      .emit(
        'currentConversation',
        ConversationDto.fromDocument(payload.conversation),
      );
  }

  @OnEvent('message.created', { async: true })
  dispatchMessage(payload: MessageCreatedEvent) {
    const { message } = payload;
    if (this.shouldDispatchMessage(message)) {
      this.server
        .to(message.visitorId.toString())
        .emit('message', MessageDto.fromDocument(message));
    }
  }

  @OnEvent('inviteEvaluation', { async: true })
  dispatchEvaluationInvitation(payload: InviteEvaluationEvent) {
    const { conversation } = payload;
    const visitorId = conversation.visitorId.toString();
    this.server.to(visitorId).emit('inviteEvaluation', {
      conversationId: conversation.id,
    });
  }
}
