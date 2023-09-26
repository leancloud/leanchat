import { Types } from 'mongoose';

import { MessageSender } from './message.interface';

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
}

export interface GetInactiveConversationIdsOptions {
  lastActivityBefore: Date;
  limit: number;
}

export interface CloseConversationOptions {
  conversationId: string | Types.ObjectId;
  by: MessageSender;
  reason?: string;
}
