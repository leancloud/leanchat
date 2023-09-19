import { MessageData, MessageSender } from './message.interface';

export interface CreateMessageData {
  conversationId: string;
  from: MessageSender;
  data: MessageData;
}
