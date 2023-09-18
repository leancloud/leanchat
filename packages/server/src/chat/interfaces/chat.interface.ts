import { MessageData } from './message.interface';

export interface StartConversationData {
  visitorId: string;
  data: MessageData;
}
