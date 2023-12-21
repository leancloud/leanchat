import { OnModuleInit, UseInterceptors, UsePipes } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Request } from 'express';
import { Namespace, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { ZodValidationPipe } from 'nestjs-zod';
import { Cron } from '@nestjs/schedule';
import _ from 'lodash';

import {
  ChatService,
  ConversationCreatedEvent,
  ConversationService,
  ConversationUpdatedEvent,
  OperatorStatusChangedEvent,
  MessageCreatedEvent,
  MessageData,
  UserType,
} from 'src/chat';
import { LeanCloudService } from 'src/leancloud';
import { WsInterceptor } from 'src/common/interceptors';
import { ConversationDto } from './dtos/conversation';
import { CreateMessageDto, MessageDto } from './dtos/message';
import {
  ConversationTransformService,
  OperatorOnlineService,
} from './services';

@WebSocketGateway({ namespace: 'o', transports: ['websocket'] })
@UsePipes(ZodValidationPipe)
@UseInterceptors(WsInterceptor)
export class ChatGateway implements OnModuleInit, OnGatewayConnection {
  @WebSocketServer()
  private server: Namespace;

  private version = process.env.LEANCLOUD_VERSION_TAG;

  constructor(
    private conversationService: ConversationService,
    private chatService: ChatService,
    private leancloudService: LeanCloudService,
    private operatorOnlineService: OperatorOnlineService,
    private convTransformService: ConversationTransformService,
  ) {}

  onModuleInit() {
    this.server.use((socket, next) => {
      const req = socket.request as Request;
      if (!req.session.uid) {
        return next(new Error('Unauthorized'));
      }
      socket.data.id = req.session.uid;
      next();
    });
  }

  async handleConnection(socket: Socket) {
    const operatorId = socket.data.id;

    try {
      const sockets = await this.server.in(operatorId).fetchSockets();
      for (const socket of sockets) {
        socket.emit('evict');
        socket.disconnect(true);
      }
    } catch {} // ignore

    socket.data.onlineTime = Date.now();
    socket.join(operatorId);
    socket.emit('welcome', {
      version: this.version,
    });
  }

  @Cron('0 * * * * *')
  async chenkOnline() {
    const operatorIds = Array.from(this.server.sockets.values()).map(
      (socket) => socket.data.id,
    );
    if (operatorIds.length === 0) {
      return;
    }
    await this.operatorOnlineService.createOnlineRecord(_.uniq(operatorIds));
    await this.operatorOnlineService.gc();
  }

  @SubscribeMessage('message')
  async handleIncomingMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: CreateMessageDto,
  ) {
    const operatorId = socket.data.id;

    const conversation = await this.conversationService.getConversation(
      data.conversationId,
    );
    if (!conversation) {
      return;
    }

    const messageData: MessageData = {};
    if (data.data.text) {
      messageData.text = data.data.text;
    } else if (data.data.file) {
      const file = await this.leancloudService.getFile(data.data.file.id);
      if (file) {
        messageData.file = file;
      }
    }

    if (Object.keys(messageData)) {
      await this.chatService.createMessage({
        conversationId: conversation.id,
        from: {
          type: UserType.Operator,
          id: operatorId,
        },
        data: messageData,
      });
    }
  }

  @OnEvent('conversation.created', { async: true })
  async handleConversationCreated(payload: ConversationCreatedEvent) {
    this.server.emit(
      'conversationCreated',
      ConversationDto.fromDocument(payload.conversation),
    );
  }

  @OnEvent('conversation.updated', { async: true })
  async handleConversationUpdated(payload: ConversationUpdatedEvent) {
    const subscribedFields: (keyof ConversationUpdatedEvent['data'])[] = [
      'status',
      'operatorId',
      'categoryId',
      'evaluation',
      'evaluationInvitedAt',
      'visitorWaitingSince',
    ];
    if (!subscribedFields.some((field) => field in payload.data)) {
      return;
    }

    const dto = await this.convTransformService.composeConversation(
      payload.conversation,
    );

    this.server.emit('conversationUpdated', {
      conversation: dto,
      fields: Object.keys(payload.data),
    });
  }

  @OnEvent('message.created', { async: true })
  dispatchMessage(payload: MessageCreatedEvent) {
    this.server.emit('message', MessageDto.fromDocument(payload.message));
  }

  @OnEvent('operator.statusChanged', { async: true })
  dispatchOperatorStatusChanged(payload: OperatorStatusChangedEvent) {
    this.server.emit('operatorStatusChanged', {
      operatorId: payload.operatorId,
      status: payload.status,
    });
  }
}
