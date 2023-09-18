import { ConversationEvaluation } from './conversation.interface';

export interface MessageSender {
  type: 'visitor' | 'operator';
  id: string;
}

export type MessageType = 'message' | 'evaluate';

export interface MessageData {
  text?: string;
  evaluation?: ConversationEvaluation;
}

export interface CreateMessageData {
  visitorId: string;
  conversationId: string;
  sender?: MessageSender;
  type: MessageType;
  data: MessageData;
}

export interface GetMessagesOptions {
  visitorId?: string;
  type?: string[];
  desc?: boolean;
  limit?: number;
}
