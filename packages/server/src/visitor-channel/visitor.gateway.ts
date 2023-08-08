import {
  Inject,
  Logger,
  OnModuleInit,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
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
import { Redis } from 'ioredis';

import { MessageService } from 'src/message';
import { MessageCreatedEvent } from 'src/common/events';
import { REDIS } from 'src/redis';
import { IUpdateVisitorDto, VisitorService } from 'src/visitor';
import { WsInterceptor } from 'src/common/interceptors';
import { CreateMessageDto } from './dtos/create-message.dto';
import { AssignService } from 'src/chat-center';

@WebSocketGateway()
@UsePipes(ZodValidationPipe)
@UseInterceptors(WsInterceptor)
export class VisitorGateway implements OnModuleInit, OnGatewayConnection {
  @WebSocketServer()
  private server: Server;

  @Inject(REDIS)
  private redis: Redis;

  private readonly logger = new Logger(VisitorGateway.name);

  constructor(
    private visitorService: VisitorService,
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
    const visitorId = socket.data.id;
    const visitor = await this.visitorService.getVisitor(visitorId);
    if (!visitor) {
      throw new WsException('账户已被停用');
    }

    const message = await this.messageService.createMessage({
      visitorId,
      type: 'visitor',
      from: visitorId,
      data: data,
    });

    const updateData: IUpdateVisitorDto = {
      recentMessage: message,
    };

    if (visitor.status === 'new' || visitor.status === 'solved') {
      const queuedAt = await this.assignService.assignVisitor(visitor);
      if (queuedAt) {
        updateData.status = 'queued';
        updateData.queuedAt = queuedAt;
      }
    }

    await this.visitorService.updateVisitor(visitor, updateData);

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
