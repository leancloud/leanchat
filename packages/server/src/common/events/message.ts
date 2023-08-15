import { Message } from 'src/message';

export interface MessageCreatedEvent {
  message: Message;
  channel: string;
  socketId?: string;
}
