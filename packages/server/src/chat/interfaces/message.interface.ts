import { Types } from 'mongoose';

import { LeanCloudFile } from 'src/leancloud';
import { ConversationEvaluation } from './conversation.interface';

export interface MessageSender {
  type: 'visitor' | 'operator' | 'system';
  id?: string | Types.ObjectId;
}

export type MessageType = 'message' | 'evaluate' | 'close';

export interface MessageData {
  text?: string;
  file?: LeanCloudFile;
  evaluation?: ConversationEvaluation;
  reason?: string;
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
