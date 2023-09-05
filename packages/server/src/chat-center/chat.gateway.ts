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
import { MessageCreatedEvent } from 'src/event';
import { ConversationEvaluationInvitedEvent } from 'src/events';
import { WsInterceptor } from 'src/common/interceptors';
import { ConversationService } from 'src/conversation';
import { OperatorService } from 'src/operator';
import { MessageService } from 'src/message';
import { CreateMessageDto } from './dtos/create-message.dto';
import { ChatService } from './services/chat.service';
import {
  ConversationAssignedEvent,
  ConversationClosedEvent,
  ConversationQueuedEvent,
  OperatorStatusChangedEvent,
} from './events';
import { ChatConversationService } from './services/chat-conversation.service';
import { AssignConversationDto } from './dtos/assign-conversation.dto';
import { CloseConversationDto } from './dtos/close-conversation.dto';
import { InviteEvaluationDto } from './dtos/invite-evaluation.dto';
import { ConversationDto } from './dtos/conversation';

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
    socket.join(socket.data.id);
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
    await this.chatService.setOperatorStatus(operatorId, status);
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

    const status = await this.chatService.getOperatorStatus(operator.id);
    if (status !== 'ready') {
      throw new WsException(`客服 ${data.conversationId} 不是在线状态`);
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
      visitorId: conv.visitor._id.toString(),
      conversationId: conv.id,
      type: 'message',
      from: { type: 'operator', id: operatorId },
      data: data.data,
    });

    await this.conversationService.updateConversation(conv, {
      lastMessage: message,
    });
  }

  @SubscribeMessage('inviteEvaluation')
  async handleInviteEvaluation(@MessageBody() data: InviteEvaluationDto) {
    const conv = await this.conversationService.getConversation(
      data.conversationId,
    );
    if (!conv) {
      throw new WsException('会话不存在');
    }
    if (conv.evaluation) {
      throw new WsException('会话已评价');
    }
    this.events.emit('conversation.evaluationInvited', {
      conversation: conv,
    } satisfies ConversationEvaluationInvitedEvent);
  }

  @OnEvent('message.created', { async: true })
  dispatchMessage(payload: MessageCreatedEvent) {
    this.server.emit('message', payload.message);
  }

  @OnEvent('conversation.queued', { async: true })
  dispatchConversationQueued(payload: ConversationQueuedEvent) {
    this.server.emit('conversationQueued', {
      conversation: ConversationDto.fromDocument(payload.conversation),
    });
  }

  @OnEvent('conversation.assigned', { async: true })
  dispatchConversationAssigned(payload: ConversationAssignedEvent) {
    this.server.emit('conversationAssigned', {
      conversation: ConversationDto.fromDocument(payload.conversation),
    });
  }

  @OnEvent('conversation.closed', { async: true })
  dispatchConversationClosed(payload: ConversationClosedEvent) {
    this.server.emit('conversationClosed', {
      conversation: ConversationDto.fromDocument(payload.conversation),
    });
  }

  @OnEvent('operator.status.changed', { async: true })
  dispatchOperatorStatusChanged(payload: OperatorStatusChangedEvent) {
    this.server.emit('operatorStatusChanged', {
      operatorId: payload.operatorId,
      status: payload.status,
    });
  }
}
