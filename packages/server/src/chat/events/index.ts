import { Message } from '../models/message.model';

export interface MessageCreatedEvent {
  message: Message;
}
