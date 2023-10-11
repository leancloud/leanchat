import { LeanCloudFile } from 'src/leancloud';
import { ConversationEvaluation } from './conversation.interface';
import { UserInfo } from './common';
import { MessageType } from '../constants';

export interface MessageData {
  text?: string;
  file?: LeanCloudFile;
  evaluation?: ConversationEvaluation;
  reason?: string;
}

export interface CreateMessageData {
  from: UserInfo;
  type: MessageType;
  data?: any;
}

export interface GetMessagesOptions {
  conversationId?: string;
  visitorId?: string;
  type?: MessageType[];
  desc?: boolean;
  limit?: number;
  cursor?: Date;
}
