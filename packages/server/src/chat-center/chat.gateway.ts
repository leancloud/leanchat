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

import {
  ChatService,
  ConversationCreatedEvent,
  ConversationService,
  ConversationUpdatedEvent,
  OperatorStatusChangedEvent,
  MessageCreatedEvent,
  MessageService,
} from 'src/chat';
import { WsInterceptor } from 'src/common/interceptors';
import { CreateMessageDto } from './dtos/create-message.dto';
import { ConversationDto } from './dtos/conversation';
import { MessageDto } from './dtos/message';

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

    await this.chatService.createMessage({
      conversationId: conversation.id,
      from: {
        type: 'operator',
        id: operatorId,
      },
      data: data.data,
    });
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
