import { Types } from 'mongoose';

import { MessageSender } from './message.interface';
import type { Conversation } from '../models';

export interface CreateConversationData {
  channel: string;
  visitorId: string;
}

export interface GetConversationOptions {
  operatorId?: string | null;
  status?: 'open' | 'closed';
  desc?: boolean;
  limit?: number;
}

export interface ConversationEvaluation {
  star: number;
  feedback: string;
}

export interface UpdateConversationData {
  operatorId?: string;
  categoryId?: string;
  evaluation?: ConversationEvaluation;
  closedAt?: Date;
  queuedAt?: Date;
  visitorLastActivityAt?: Date;
  operatorLastActivityAt?: Date;
  visitorWaitingSince?: Date | null;
  stats?: Conversation['stats'];
}

export interface GetInactiveConversationIdsOptions {
  lastActivityBefore: Date;
  limit: number;
}

export interface CloseConversationOptions {
  conversationId: string | Types.ObjectId;
  by: MessageSender;
}

export interface ConversationStatsJobData {
  conversationId: string;
}

export interface GetConversationStatsOptions {
  from: Date;
  to: Date;
  channel?: string;
  operatorId?: string[];
}

export interface GetConversationMessageStatsOptions {
  from: Date;
  to: Date;
  channel?: string;
  operatorId?: string[];
}
