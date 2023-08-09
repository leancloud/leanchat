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
import { EventEmitter2 } from 'eventemitter2';
import { ZodValidationPipe } from 'nestjs-zod';

import { MessageService } from 'src/message';
import { MessageCreatedEvent } from 'src/common/events';
import { AssignService } from 'src/chat-center';
import { ConversationService } from 'src/conversation';
import { VisitorService } from 'src/visitor';
import { WsInterceptor } from 'src/common/interceptors';
import { CreateMessageDto } from './dtos/create-message.dto';
import { UpdateConversationData } from 'src/conversation/interfaces';

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
      const conversation =
        await this.conversationService.getActiveConversationForVisitor(
          visitor.id,
        );

      socket.data.id = visitor.id;
      socket.data.cid = conversation.id;
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
    const { id, cid } = socket.data;

    const visitor = await this.visitorService.getVisitor(id);
    if (!visitor) {
      throw new WsException('账户已被删除');
    }

    const conv = await this.conversationService.getConversation(cid);
    if (!conv) {
      throw new WsException('会话已被删除');
    }

    const message = await this.messageService.createMessage({
      visitorId: id,
      type: 'visitor',
      from: id,
      data: data,
    });

    const updateData: UpdateConversationData = {
      lastMessage: message,
    };
    if (conv.status === 'new') {
      const queuedAt = await this.assignService.assignConversation(conv);
      if (queuedAt) {
        updateData.status = 'queued';
        updateData.queuedAt = queuedAt;
      }
    }
    await this.conversationService.updateConversation(conv, updateData);

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
