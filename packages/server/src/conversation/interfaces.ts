import { Types } from 'mongoose';

import { Message } from 'src/message';
import { Conversation } from './conversation.model';

export interface CreateConversationData {
  channel: string;
  visitorId: Types.ObjectId | string;
}

export interface UpdateConversationData {
  status?: string;
  operatorId?: string;
  lastMessage?: Message;
  evaluation?: {
    star: number;
    feedback: string;
  };
  categoryId?: string;
  timestamps?: Conversation['timestamps'];
}

export interface GetConversationOptions {
  status?: string;
  visitorId?: string;
  operatorId?: string | null;

  sort?: string;
  desc?: boolean;
  limit?: number;
  cursor?: Date;
}

export interface EvaluateConversationData {
  star: number;
  feedback: string;
}

export interface ConversationStatsJobData {
  conversationId: string;
}

export interface GetConversationStatsOptions {
  from: Date;
  to: Date;
  channel?: string;
  operatorId?: string | string[];
}
