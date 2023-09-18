import { ConversationEvaluation } from './conversation.interface';

export type MessageType = 'message' | 'evaluate';

export interface MessageData {
  text?: string;
  evaluation?: ConversationEvaluation;
}

export interface CreateMessageData {
  visitorId: string;
  conversationId: string;
  from?: {
    type: 'visitor' | 'operator';
    id: string;
  };
  type: MessageType;
  data: MessageData;
}
