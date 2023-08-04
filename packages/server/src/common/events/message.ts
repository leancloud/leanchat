import { IMessage } from '../interfaces/message';

export interface MessageCreatedEvent {
  message: IMessage;
  channel: string;
  socketId?: string;
}
