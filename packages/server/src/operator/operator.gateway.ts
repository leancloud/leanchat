import { OnModuleInit } from '@nestjs/common';
import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Request } from 'express';
import { Namespace, Socket } from 'socket.io';
import { EventEmitter2 } from 'eventemitter2';
import { OnEvent } from '@nestjs/event-emitter';
import { MessageCreatedEvent } from 'src/common/events';

@WebSocketGateway({ namespace: 'o' })
export class OperatorGateway implements OnModuleInit, OnGatewayConnection {
  @WebSocketServer()
  private server: Namespace;

  constructor(private events: EventEmitter2) {}

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

  handleConnection(socket: Socket) {
    console.log('operator online', socket.data.id);
  }

  @SubscribeMessage('subscribeConversation')
  handleSubscribeConversation(socket: Socket, id: string) {
    socket.join(id);
  }

  @SubscribeMessage('unsubscribeConversation')
  handleUnsubscribeConversation(socket: Socket, id: string) {
    socket.leave(id);
  }

  @OnEvent('message.created')
  dispatchMessage(payload: MessageCreatedEvent) {
    this.server.to(payload.message.visitorId).emit('message', payload.message);
  }
}
