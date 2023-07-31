import { EventEmitter } from 'node:events';
import { Logger } from 'pino';

import { Customer } from './customer-manager.js';
import { Message } from './message.type.js';
import { ConversationManager } from './conversation-manager.js';

export interface CustomerSession {
  customer: Customer;
  cid: string;
  onlineTime: number;
}

interface SendMessageOptions {
  customerId: string;
  text: string;
}

export class CustomerGateway {
  private customers = new Map<string, CustomerSession>();

  constructor(
    private events: EventEmitter,
    private conversationManager: ConversationManager,
    private logger: Logger
  ) {}

  async customerOnline(customer: Customer) {
    const conversation = await this.conversationManager.createConversation(customer.id);
    this.customers.set(customer.id, {
      customer,
      cid: conversation.id,
      onlineTime: Date.now(),
    });
    this.logger.debug('customer %s online');
  }

  customerOffline(customerId: string) {
    this.customers.delete(customerId);
    this.logger.debug('customer %s offline', customerId);
  }

  async sendMessage({ customerId, text }: SendMessageOptions) {
    const session = this.customers.get(customerId);
    if (!session) {
      throw new Error('no session');
    }

    const message = await this.conversationManager.persistMessage(session.cid, customerId, text);
    return message;
  }
}
