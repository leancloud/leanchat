import { OnModuleInit, UsePipes } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { EventEmitter2 } from 'eventemitter2';
import { ZodValidationPipe } from 'nestjs-zod';
import _ from 'lodash';

import { ChatService } from 'src/chat';
import { MessageCreatedEvent } from 'src/common/events';
import { VisitorService } from './visitor.service';
import { CreateMessageDto } from './dtos/create-message.dto';
import { IUpdateVisitorDto } from './interfaces';

@WebSocketGateway()
@UsePipes(ZodValidationPipe)
export class VisitorGateway implements OnModuleInit, OnGatewayConnection {
  @WebSocketServer()
  private server: Server;

  constructor(
    private visitorService: VisitorService,
    private chatService: ChatService,
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
    const message = await this.chatService.createMessage({
      visitorId,
      type: 'visitor',
      from: visitorId,
      data: data,
    });

    const updateData: IUpdateVisitorDto = {
      recentMessage: message,
    };

    if (!socket.data.status) {
      socket.data.status = 'queued';
      updateData.status = 'queued';
    }

    await this.visitorService.updateVisitor(visitorId, updateData);

    this.events.emit('message.created', {
      message,
      channel: 'chat',
      socketId: socket.id,
    });

    return message;
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
