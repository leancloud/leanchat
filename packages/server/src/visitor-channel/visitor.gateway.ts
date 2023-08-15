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
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { ZodValidationPipe } from 'nestjs-zod';

import { MessageService } from 'src/message';
import { MessageCreatedEvent } from 'src/common/events';
import { AssignService } from 'src/chat-center';
import { Conversation, ConversationService } from 'src/conversation';
import { VisitorService } from 'src/visitor';
import { WsInterceptor } from 'src/common/interceptors';
import { CreateMessageDto } from './dtos/create-message.dto';

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

    private events: EventEmitter2,
    private assignService: AssignService,
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

  handleConnection(socket: Socket) {
    console.log('visitor online', socket.data.id);
    socket.join(socket.data.id);
  }

  @SubscribeMessage('message')
  async handleIncommingMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: CreateMessageDto,
  ) {
    const { id } = socket.data;

    let visitor = await this.visitorService.getVisitor(id);
    if (!visitor) {
      throw new WsException('账户已被删除');
    }

    let conv: Conversation | undefined;
    if (visitor.currentConversationId) {
      conv = await this.conversationService.getConversation(
        visitor.currentConversationId,
      );
    }
    if (!conv || conv.status === 'solved') {
      conv = await this.conversationService.createConversation(id);
      visitor = await this.visitorService.updateVisitor(visitor, {
        currentConversationId: conv.id,
      });
    }

    const message = await this.messageService.createMessage({
      visitorId: id,
      conversationId: conv.id,
      type: 'visitor',
      from: id,
      data: data,
    });

    await this.conversationService.updateConversation(conv, {
      lastMessage: message,
    });

    if (conv.status === 'new') {
      await this.assignService.assignConversation(conv);
    }

    this.events.emit('message.created', {
      message,
      channel: 'chat',
      socketId: socket.id,
    });

    return message;
  }

  @SubscribeMessage('getHistory')
  handleGetHistory(@ConnectedSocket() socket: Socket) {
    const visitorId = socket.data.id;
    return this.messageService.getMessages({
      visitorId,
      types: ['visitor', 'operator'],
    });
  }

  @OnEvent('message.created', { async: true })
  dispatchMessage(payload: MessageCreatedEvent) {
    let op = this.server.to(payload.message.visitorId);
    if (payload.socketId) {
      op = op.except(payload.socketId);
    }
    op.emit('message', payload.message);
  }
}
