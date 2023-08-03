import { OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ValidateMessageBody } from 'src/common';
import { ChatService } from 'src/chat';
import { VisitorService } from './visitor.service';
import { MessageSchema } from './schemas';
import { IMessageEventBody } from './interfaces';
import { Visitor } from './visitor.entity';

@WebSocketGateway()
export class VisitorGateway implements OnModuleInit, OnGatewayConnection {
  @WebSocketServer()
  private server: Server;

  constructor(
    private visitorService: VisitorService,
    private chatService: ChatService,
  ) {}

  onModuleInit() {
    this.server.use(async (socket, next) => {
      const { id } = socket.handshake.auth;
      if (typeof id !== 'string') {
        return next(new Error('Invalid visitor ID'));
      }

      const visitor = await this.visitorService.registerVisitorByAnonymousId(
        id,
      );
      socket.data.visitor = visitor;
      next();
    });
  }

  handleConnection(socket: Socket) {
    console.log('visitor online', socket.data.visitor.id);
  }

  @SubscribeMessage('message')
  async handleMessageEvent(
    @ConnectedSocket() socket: Socket,
    @ValidateMessageBody(MessageSchema) data: IMessageEventBody,
  ) {
    const visitor: Visitor = socket.data.visitor;
    const message = await this.chatService.createMessage({
      conversation: `visitor_${visitor.id}`,
      from: {
        type: 'visitor',
        id: visitor.id,
      },
      type: 'message',
      data: {
        content: data.content,
      },
    });
    return message;
  }
}
