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
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { MessageService } from 'src/message';
import { MessageCreatedEvent } from 'src/common/events';
import { REDIS } from 'src/redis';
import { VisitorService } from './visitor.service';
import { CreateMessageDto } from './dtos/create-message.dto';
import { IUpdateVisitorDto } from './interfaces';
import { WsInterceptor } from 'src/common/interceptors';
import { IAssignVisitorJobData } from 'src/common/interfaces';

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

    @InjectQueue('assign_visitor')
    private assignVisitorQueue: Queue,
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
      const now = new Date();
      const queued = await this.redis.zadd(
        'visitor_queue',
        'NX',
        now.getTime(),
        visitor.id,
      );
      if (queued) {
        this.logger.debug('visitor start a new conversation', { visitorId });
        await this.assignVisitorQueue.add({
          visitorId,
        } satisfies IAssignVisitorJobData);
        updateData.status = 'queued';
        updateData.queuedAt = now;
      }
    }

    await this.visitorService.updateVisitor(visitorId, updateData);

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
