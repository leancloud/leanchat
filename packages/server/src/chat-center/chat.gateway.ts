import {
  OnModuleInit,
  UseFilters,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Request } from 'express';
import { Namespace, Socket } from 'socket.io';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { WsFilter } from 'src/common/filters';
import { MessageCreatedEvent } from 'src/common/events';
import { WsInterceptor } from 'src/common/interceptors';
import { VisitorService } from 'src/visitor';
import { ConversationService } from 'src/conversation';
import { OperatorService } from 'src/operator';
import { MessageService } from 'src/message';
import { CreateMessageDto } from './dtos/create-message.dto';
import { ChatService } from './chat.service';
import {
  ConversationAssignedEvent,
  ConversationClosedEvent,
  ConversationQueuedEvent,
} from './events';
import { ChatConversationService } from './services/chat-conversation.service';
import { AssignConversationDto } from './dtos/assign-conversation.dto';
import { CloseConversationDto } from './dtos/close-conversation.dto';

@WebSocketGateway({ namespace: 'o' })
@UseFilters(WsFilter)
@UsePipes(ZodValidationPipe)
@UseInterceptors(WsInterceptor)
export class ChatGateway
  implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Namespace;

  constructor(
    private events: EventEmitter2,
    private visitorService: VisitorService,
    private conversationService: ConversationService,
    private operatorService: OperatorService,
    private messageService: MessageService,
    private chatService: ChatService,
    private chatConvService: ChatConversationService,
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
    console.log('operator online', socket.data.id);
  }

  handleDisconnect(socket: Socket) {
    console.log('operator offline', socket.data.id);
  }

  @SubscribeMessage('setStatus')
  async handleSetStatus(
    @ConnectedSocket() socket: Socket,
    @MessageBody(new ZodValidationPipe(z.enum(['ready', 'leave', 'busy'])))
    status: string,
  ) {
    const operatorId = socket.data.id;
    if (status === 'ready') {
      await this.chatService.setOperatorReady(operatorId);
    } else {
      await this.chatService.setOperatorStatus(operatorId, status);
    }
  }

  @SubscribeMessage('assignConversation')
  async handleAssignConversation(@MessageBody() data: AssignConversationDto) {
    const conv = await this.conversationService.getConversation(
      data.conversationId,
    );
    if (!conv) {
      throw new WsException('会话不存在');
    }

    const operator = await this.operatorService.getOperator(data.operatorId);
    if (!operator) {
      throw new WsException(`客服 ${data.operatorId} 不存在`);
    }

    await this.chatConvService.assign(conv, operator);
  }

  @SubscribeMessage('closeConversation')
  async handleCloseConversation(@MessageBody() data: CloseConversationDto) {
    const conv = await this.conversationService.getConversation(
      data.conversationId,
    );
    if (!conv) {
      throw new WsException('会话不存在');
    }
    await this.chatConvService.close(conv);
  }

  @SubscribeMessage('message')
  async handleIncomingMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: CreateMessageDto,
  ) {
    const operatorId = socket.data.id;

    const conv = await this.conversationService.getConversation(
      data.conversationId,
    );
    if (!conv) {
      throw new WsException(`对话 ${data.conversationId} 不存在`);
    }
    if (conv.status === 'solved') {
      throw new WsException('对话已结束');
    }

    const message = await this.messageService.createMessage({
      visitorId: conv.visitorId,
      conversationId: conv.id,
      type: 'operator',
      from: operatorId,
      data: {
        content: data.content,
      },
    });

    await this.conversationService.updateConversation(conv, {
      lastMessage: message,
    });

    this.events.emit('message.created', {
      message,
      channel: 'chat',
      socketId: socket.id,
    } satisfies MessageCreatedEvent);
  }

  @OnEvent('message.created')
  dispatchMessage(payload: MessageCreatedEvent) {
    this.server.emit('message', payload.message);
  }

  @OnEvent('conversation.queued')
  dispatchConversationQueued(payload: ConversationQueuedEvent) {
    this.server.emit('conversationQueued', {
      conversationId: payload.conversationId,
    });
  }

  @OnEvent('conversation.assigned')
  dispatchConversationAssigned(payload: ConversationAssignedEvent) {
    this.server.emit('conversationAssigned', {
      conversationId: payload.conversation.id,
      operatorId: payload.operator.id,
    });
  }

  @OnEvent('conversation.closed')
  dispatchConversationClosed(payload: ConversationClosedEvent) {
    this.server.emit('conversationClosed', {
      conversationId: payload.conversation.id,
    });
  }
}
