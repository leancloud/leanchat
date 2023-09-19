import { Types } from 'mongoose';

import { ConversationEvaluation } from './conversation.interface';

export interface MessageSender {
  type: 'visitor' | 'operator';
  id: string | Types.ObjectId;
}

export type MessageType = 'message' | 'evaluate' | 'closeConversation';

export interface MessageData {
  text?: string;
  evaluation?: ConversationEvaluation;
}

export interface CreateMessageData {
  from: MessageSender;
  type: MessageType;
  data: MessageData;
}

export interface GetMessagesOptions {
  conversationId?: string;
  visitorId?: string;
  type?: string[];
  desc?: boolean;
  limit?: number;
  cursor?: Date;
}
