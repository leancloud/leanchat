import { MessageData, MessageSender } from './message.interface';

export interface CreateMessageData {
  conversationId: string;
  sender: MessageSender;
  data: MessageData;
}
