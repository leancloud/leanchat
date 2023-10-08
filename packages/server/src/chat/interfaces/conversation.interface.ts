import { Types } from 'mongoose';

import type { Conversation } from '../models';
import { UserInfo } from './common';

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
  closedBy?: UserInfo;
  queuedAt?: Date;
  visitorLastActivityAt?: Date;
  operatorLastActivityAt?: Date;
  visitorWaitingSince?: Date | null;
  inviteEvaluationAt?: Date;
  stats?: Conversation['stats'];
}

export interface GetInactiveConversationIdsOptions {
  lastActivityBefore: Date;
  limit: number;
}

export interface CloseConversationOptions {
  conversationId: string | Types.ObjectId;
  by: UserInfo;
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
