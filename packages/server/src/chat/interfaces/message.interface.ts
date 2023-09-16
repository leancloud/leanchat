import { ConversationEvaluation } from './conversation.interface';

export type MessageType = 'message' | 'evaluate';

export interface CreateMessageData {
  visitorId: string;
  conversationId: string;
  from?: {
    type: 'visitor' | 'operator';
    id: string;
  };
  type: MessageType;
  data: {
    text?: string;
    evaluation?: ConversationEvaluation;
  };
}
