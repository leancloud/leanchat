import { OnModuleInit, UseInterceptors, UsePipes } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { ZodValidationPipe } from 'nestjs-zod';

import { Message, MessageService } from 'src/message';
import { MessageCreatedEvent } from 'src/event';
import { ConversationEvaluationInvitedEvent } from 'src/events';
import {
  ConversationDocument,
  ConversationService,
  ConversationStatus,
} from 'src/conversation';
import { VisitorService } from 'src/visitor';
import { WsInterceptor } from 'src/common/interceptors';
import { CreateMessageDto } from './dtos/create-message.dto';
import { EvaluationDto } from './dtos/evaluation.dto';

@WebSocketGateway()
@UsePipes(ZodValidationPipe)
@UseInterceptors(WsInterceptor)
export class VisitorGateway implements OnModuleInit, OnGatewayConnection {
  @WebSocketServer()
  private server: Server;

  constructor(
    private visitorService: VisitorService,
    private conversationService: ConversationService,
    private messageService: MessageService,
  ) {}

  onModuleInit() {
    this.server.use(async (socket, next) => {
      const { id } = socket.handshake.auth;
      if (typeof id !== 'string') {
        return next(new Error('Invalid visitor ID'));
      }

      const visitor = await this.visitorService.registerVisitorFromChatChannel(
        id,
      );

      socket.data.id = visitor.id;
      next();
    });
  }

  async handleConnection(socket: Socket) {
    console.log('visitor online', socket.data.id);
    socket.join(socket.data.id);

    const visitor = await this.visitorService.getVisitor(socket.data.id);
    if (visitor) {
      if (visitor.currentConversationId) {
        const conv = await this.conversationService.getConversation(
          visitor.currentConversationId,
        );
        if (conv) {
          socket.emit('currentConversation', conv);
        }
      }

      const messages = await this.messageService.getMessages({
        visitorId: visitor.id,
        type: 'message',
        desc: true,
      });
      socket.emit('messages', messages.reverse());
    }
  }

  @SubscribeMessage('message')
  async handleIncommingMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: CreateMessageDto,
  ) {
    const { id } = socket.data;

    const visitor = await this.visitorService.getVisitor(id);
    if (!visitor) {
      throw new WsException('账户已被删除');
    }

    let conv: ConversationDocument | null | undefined;
    if (visitor.currentConversationId) {
      conv = await this.conversationService.getConversation(
        visitor.currentConversationId,
      );
    }
    if (!conv || conv.status === ConversationStatus.Solved) {
      conv = await this.conversationService.createConversation({
        channel: 'chat',
        visitorId: visitor.id,
      });
      await this.visitorService.updateVisitor(visitor, {
        currentConversationId: conv.id,
      });
      socket.emit('currentConversation', conv);
    }

    const message = await this.messageService.createMessage({
      visitorId: id,
      conversationId: conv.id,
      type: 'message',
      from: { type: 'visitor', id },
      data: data.data,
    });

    await this.conversationService.updateConversation(conv, {
      lastMessage: message,
      timestamps: {
        visitorLastMessageAt: message.createdAt,
      },
    });

    return message;
  }

  @SubscribeMessage('evaluate')
  async handleEvaluate(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: EvaluationDto,
  ) {
    const visitorId = socket.data.id;
    const visitor = await this.visitorService.getVisitor(visitorId);
    if (!visitor) {
      throw new WsException('账户不存在');
    }
    if (!visitor.currentConversationId) {
      throw new WsException('当前未在会话中');
    }
    const conv = await this.conversationService.getConversation(
      visitor.currentConversationId,
    );
    if (!conv) {
      throw new WsException('当前会话不存在');
    }
    if (conv.evaluation) {
      return;
    }
    await this.conversationService.evaluateConversation(conv, data);
  }

  shouldDispatchMessage(message: Message) {
    if (message.type === 'message') {
      return true;
    }
    if (message.type === 'log' && message.data.type === 'evaluated') {
      return true;
    }
    return false;
  }

  @OnEvent('message.created', { async: true })
  dispatchMessage(payload: MessageCreatedEvent) {
    const { message } = payload;
    if (this.shouldDispatchMessage(message)) {
      const visitorId = message.visitorId.toString();
      this.server.to(visitorId).emit('message', message);
    }
  }

  @OnEvent('conversation.evaluationInvited', { async: true })
  dispatchEvaluationInvitation(payload: ConversationEvaluationInvitedEvent) {
    const { conversation } = payload;
    const visitorId = conversation.visitorId.toString();
    this.server.to(visitorId).emit('inviteEvaluation', {
      conversationId: conversation.id,
    });
  }
}
