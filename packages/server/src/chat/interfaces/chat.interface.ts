import { UserInfo } from './common';
import { MessageData } from './message.interface';

export interface CreateMessageData {
  conversationId: string;
  from: UserInfo;
  data: MessageData;
}
