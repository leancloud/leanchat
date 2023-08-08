import {
  Inject,
  OnModuleInit,
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
import { EventEmitter2 } from 'eventemitter2';
import { OnEvent } from '@nestjs/event-emitter';
import { ZodValidationPipe } from 'nestjs-zod';
import { Redis } from 'ioredis';
import { z } from 'nestjs-zod/z';

import { MessageCreatedEvent } from 'src/common/events';
import { WsInterceptor } from 'src/common/interceptors';
import { REDIS } from 'src/redis';
import { VisitorService } from 'src/visitor';
import { MessageService } from 'src/message';
import { CreateMessageDto } from './dtos/create-message.dto';

@WebSocketGateway({ namespace: 'o' })
@UsePipes(ZodValidationPipe)
@UseInterceptors(WsInterceptor)
export class ChatGateway
  implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Namespace;

  @Inject(REDIS)
  private redis: Redis;

  constructor(
    private events: EventEmitter2,
    private visitorService: VisitorService,
    private messageService: MessageService,
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
    const pp = this.redis.pipeline();
    pp.hset('operator_status', operatorId, status);
    if (status === 'ready') {
      const visitorCount = await this.visitorService.getVisitorCountForOperator(
        operatorId,
      );
      pp.hset('operator_concurrency', operatorId, visitorCount);
    }
    await pp.exec();
  }

  @SubscribeMessage('getStatus')
  async handleGetStatus(@ConnectedSocket() socket: Socket) {
    const status = await this.redis.hget('operator_status', socket.data.id);
    return status || 'leave';
  }

  @SubscribeMessage('subscribeConversation')
  handleSubscribeConversation(socket: Socket, id: string) {
    socket.join(id);
  }

  @SubscribeMessage('unsubscribeConversation')
  handleUnsubscribeConversation(socket: Socket, id: string) {
    socket.leave(id);
  }

  @SubscribeMessage('message')
  async handleIncomingMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: CreateMessageDto,
  ) {
    const operatorId = socket.data.id;

    const visitor = await this.visitorService.getVisitor(data.visitorId);
    if (!visitor) {
      throw new WsException(`Visitor ${data.visitorId} not exists`);
    }
    if (visitor.operatorId !== operatorId) {
      throw new WsException(`Forbidden`);
    }

    const message = await this.messageService.createMessage({
      visitorId: data.visitorId,
      type: 'operator',
      from: operatorId,
      data: {
        content: data.content,
      },
    });

    await this.visitorService.updateVisitor(visitor, {
      recentMessage: message,
    });

    this.events.emit('message.created', {
      message,
      channel: 'chat',
      socketId: socket.id,
    } satisfies MessageCreatedEvent);

    return message;
  }

  @OnEvent('message.created')
  dispatchMessage(payload: MessageCreatedEvent) {
    let op = this.server.to(payload.message.visitorId);
    if (payload.socketId) {
      op = op.except(payload.socketId);
    }
    op.emit('message', payload.message);
  }
}
