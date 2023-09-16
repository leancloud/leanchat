import { CreateMessageData } from './message.interface';

export interface StartConversationData {
  visitorId: string;
  data: CreateMessageData['data'];
}

export interface CreateVisitorMessageData {
  conversationId: string;
  visitorId: string;
  data: CreateMessageData['data'];
}
