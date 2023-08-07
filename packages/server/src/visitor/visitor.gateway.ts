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
import _ from 'lodash';

import { MessageService } from 'src/message';
import { MessageCreatedEvent } from 'src/common/events';
import { VisitorService } from './visitor.service';
import { CreateMessageDto } from './dtos/create-message.dto';
import { IUpdateVisitorDto } from './interfaces';
import { WsInterceptor } from 'src/common/interceptors';

@WebSocketGateway()
@UsePipes(ZodValidationPipe)
@UseInterceptors(WsInterceptor)
export class VisitorGateway implements OnModuleInit, OnGatewayConnection {
  @WebSocketServer()
  private server: Server;

  constructor(
    private visitorService: VisitorService,
    private messageService: MessageService,
    private events: EventEmitter2,
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
      socket.data = _.pick(visitor, ['id', 'status']);
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

    if (!visitor.status || visitor.status === 'solved') {
      updateData.status = 'queued';
      updateData.queuedAt = new Date();
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
    if (payload.channel === 'chat' && payload.socketId) {
      op = op.except(payload.socketId);
    }
    op.emit('message', payload.message);
  }
}
