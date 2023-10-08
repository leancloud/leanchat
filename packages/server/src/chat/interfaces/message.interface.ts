import { LeanCloudFile } from 'src/leancloud';
import { ConversationEvaluation } from './conversation.interface';
import { UserInfo } from './common';

export interface MessageData {
  text?: string;
  file?: LeanCloudFile;
  evaluation?: ConversationEvaluation;
  reason?: string;
}

export interface CreateMessageData {
  from: UserInfo;
  type: string;
  data?: any;
}

export interface GetMessagesOptions {
  conversationId?: string;
  visitorId?: string;
  type?: string[];
  desc?: boolean;
  limit?: number;
  cursor?: Date;
}
