import { EventEmitter } from 'node:events';
import { Message } from './message.type.js';

export class MessageEvents extends EventEmitter {
  send(message: Message) {
    this.emit('message', message);
  }
}
