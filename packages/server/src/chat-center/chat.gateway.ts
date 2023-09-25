import { OnModuleInit, UseInterceptors, UsePipes } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
  MessageService,
} from 'src/chat';
import { LeanCloudService } from 'src/leancloud';
import { WsInterceptor } from 'src/common/interceptors';
import { ConversationDto } from './dtos/conversation';
import { CreateMessageDto, MessageDto } from './dtos/message';
import { OnlineTimeService } from './services';

@WebSocketGateway({ namespace: 'o' })
@UsePipes(ZodValidationPipe)
@UseInterceptors(WsInterceptor)
export class ChatGateway
  implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Namespace;

  constructor(
    private conversationService: ConversationService,
    private messageService: MessageService,
    private chatService: ChatService,
    private leancloudService: LeanCloudService,
    private onlineTimeService: OnlineTimeService,
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

  @Cron('0 * * * * *')
  chenkOnline() {
    const operatorIds = Array.from(this.server.sockets.values()).map(
      (socket) => socket.data.id,
    );
    if (operatorIds.length === 0) {
      return;
    }
    this.onlineTimeService.recordOnlineTime(_.uniq(operatorIds));
  }

  async handleConnection(socket: Socket) {
    socket.join(socket.data.id);
    console.log('operator online', socket.data.id);
  }

  handleDisconnect(socket: Socket) {
    console.log('operator offline', socket.data.id);
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
    if (!conversation || conversation.closedAt) {
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
          type: 'operator',
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
      'operatorId',
      'categoryId',
      'evaluation',
      'closedAt',
      'visitorWaitingSince',
    ];
    if (!subscribedFields.some((field) => field in payload.data)) {
      return;
    }

    const dto = ConversationDto.fromDocument(payload.conversation);
    const lastMessage = await this.messageService.getLastMessage(
      payload.conversation.id,
    );
    if (lastMessage) {
      dto.lastMessage = MessageDto.fromDocument(lastMessage);
    }
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
