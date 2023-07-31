import { EventEmitter } from 'node:events';
import { Namespace, Socket } from 'socket.io';
import { catchError, fromEvent, map, mergeMap, retry } from 'rxjs';
import { Logger } from 'pino';

import { Customer, CustomerManager } from './customer-manager.js';
import { ConversationManager } from './conversation-manager.js';
import { Message } from './message.type.js';
import { SocketRpc } from './socket-rpc.js';
import { zodValidation } from './middleware.js';
import { CustomerGateway } from './customer-gateway.js';
import * as schema from './schemas.js';

export class CustomerChannelWs {
  constructor(
    private io: Namespace,
    private events: EventEmitter,
    private customerManager: CustomerManager,
    private customerGateway: CustomerGateway,
    private logger: Logger
  ) {
    io.use(async (socket, next) => {
      const customerId = socket.handshake.auth.id;
      const customer = await this.customerManager.getCustomer(customerId);
      if (!customer) {
        return next(new Error('customer not found'));
      }
      await this.customerGateway.customerOnline(customer);
      socket.data.uid = customer.id;
      socket.on('disconnect', () => {
        this.customerGateway.customerOffline(customer.id);
      });
      next();
    });

    const rpc = new SocketRpc();
    rpc.define('message', zodValidation(schema.message), (ctx) => {
      return this.customerGateway.sendMessage({
        customerId: ctx.socket.data.uid,
        text: ctx.param.text,
      });
    });

    io.use(rpc.middleware());
  }
}
