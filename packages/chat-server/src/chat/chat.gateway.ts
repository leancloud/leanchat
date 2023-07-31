import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { OnModuleInit, UseFilters, UseInterceptors } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import { ConversationService } from '../conversation/conversation.service';
import { GatewayExceptionFilter } from './exception-filter';
import { MsgInterceptor } from './msg.interceptor';

@WebSocketGateway()
@UseFilters(GatewayExceptionFilter)
@UseInterceptors(MsgInterceptor)
export class ChatGateway implements OnGatewayConnection, OnModuleInit {
  @WebSocketServer()
  private server: Server;

  constructor(private convService: ConversationService) {}

  onModuleInit() {
    this.server.use((socket, next) => {
      console.log(socket.id);
      next();
    });
  }

  handleConnection(socket: Socket) {
    socket.data.uid = socket.handshake.auth.id;
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: any,
  ) {
    throw 114514;
    return {
      id: 114514,
    };
  }
}
