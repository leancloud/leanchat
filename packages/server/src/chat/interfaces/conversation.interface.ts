import { Types } from 'mongoose';

import type { Conversation } from '../models';
import { NumberCondition, UserInfo } from './common';
import {
  Channel,
  ConsultationResult,
  ConversationStatus,
  UserType,
} from '../constants';

export interface CreateConversationData {
  channel: Channel;
  visitorId: string;
}

export interface GetConversationOptions {
  status?: ConversationStatus;
  operatorId?: string | null;
  desc?: boolean;
  before?: Date;
  after?: Date;
  skip?: number;
  limit?: number;
}

export interface ConversationEvaluation {
  star: number;
  feedback: string;
}

export interface UpdateConversationData {
  status?: ConversationStatus;
  operatorId?: string;
  categoryId?: string;
  evaluation?: ConversationEvaluation;
  evaluationInvitedAt?: Date;
  closedAt?: Date;
  closedBy?: UserInfo;
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
  by: UserInfo;
}

export interface ReopenConversationOptions {
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

export interface GetConversationRecordOptions {
  from: Date;
  to: Date;
  skip?: number;
  limit?: number;

  channel?: Channel;
  operatorId?: string;
  visitorId?: string;
  messageKeyword?: string;
  messageFrom?: UserType;
  duration?: NumberCondition;
  averageResponseTime?: NumberCondition;
  evaluationStar?: number;
  queued?: boolean;
  closedBy?: number;
  consultationResult?: ConsultationResult;
  categoryId?: string;
}
