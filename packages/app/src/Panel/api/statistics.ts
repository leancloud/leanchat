import { Conversation, Evaluation } from '../types';
import { client } from './client';

export interface GetConversationStatisticsFilters {
  from: Date;
  to: Date;
  channel?: string;
  operatorId?: string[];
}

export interface ConversationStatistics {
  incoming?: number;
  queued?: number;
  queuedAndConnected?: number;
  queuedAndLeft?: number;
  operatorCommunicated?: number;
  operatorIndependentCommunicated?: number;
  valid?: number;
  invalid?: number;
  operatorNoResponse?: number;
  receptionTime?: number;
  receptionCount?: number;
  firstResponseTime?: number;
  firstResponseCount?: number;
  responseTime?: number;
  responseCount?: number;
  overtime?: number;
  queueConnectionTime?: number;
  queueTimeToLeave?: number;
}

export async function getConversationStatistics(options: GetConversationStatisticsFilters) {
  const res = await client.get<ConversationStatistics>('/statistics/conversation', {
    params: {
      from: options.from.toISOString(),
      to: options.to.toISOString(),
      channel: options.channel,
      operatorId: options.operatorId?.join(',') || undefined,
    },
  });
  return res.data;
}

export interface ConversationMessageStatistics {
  operatorMessageCount?: number;
  visitorMessageCount?: number;
}

export async function getConversationMessageStatistics(options: GetConversationStatisticsFilters) {
  const res = await client.get<ConversationMessageStatistics>('/statistics/conversation-message', {
    params: {
      from: options.from.toISOString(),
      to: options.to.toISOString(),
      channel: options.channel,
      operatorId: options.operatorId?.join(',') || undefined,
    },
  });
  return res.data;
}

export interface ConversationRecord {
  id: string;
  createdAt: string;
  closedAt: string;
  visitorId: string;
  visitorName?: string;
  categoryId?: string;
  evaluation?: Conversation['evaluation'];
  evaluationInvitedAt?: string;
  stats: Record<string, any>;
  operatorId?: string;
}

interface ConversationRecordResult {
  items: ConversationRecord[];
  totalCount: number;
}

export interface GetConversationRecordStatsOptions {
  from: string;
  to: string;
  channel?: string;
  operatorId?: string;
  messageKeyword?: string;
  messageFrom?: number;
  duration?: string;
  averageResponseTime?: string;
  evaluationStar?: number;
  queued?: boolean;
  closedBy?: number;
  consultationResult?: number;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}

export async function getConversationRecordStats(options: GetConversationRecordStatsOptions) {
  const res = await client.get<ConversationRecordResult>('/statistics/conversation-record', {
    params: options,
  });
  return res.data;
}

export interface OperatorStats {
  id: string;
  conversation?: {
    totalCount: number;
    validCount: number;
    invalidCount: number;
    operatorNoResponseCount: number;
    averageFirstResponseTime: number | null;
    responseTime: number;
    responseCount: number;
    validDuration: number;
    messageCount: number;
    validEvaluationCount: number;
    validEvaluationInvitationCount: number;
  };
  online?: {
    totalTime: number;
    readyTime: number;
    busyTime: number;
    leaveTime: number;
  };
}

interface GetOperatorStatsOptions {
  from: string;
  to: string;
  operatorId?: string[];
}

export async function getOperatorStats(options: GetOperatorStatsOptions) {
  const res = await client.get<OperatorStats[]>('/statistics/operator', {
    params: {
      ...options,
      operatorId: options.operatorId?.join(',') || undefined,
    },
  });
  return res.data;
}

export interface EvaluationStats {
  id: string;
  visitorId: string;
  visitorName: string | null;
  operatorId?: string;
  evaluation: Evaluation;
  evaluationInvitedAt?: string;
}

interface EvaluationStatsResult {
  items: EvaluationStats[];
  totalCount: number;
}

export interface GetEvaluationStatsOptions {
  from: Date;
  to: Date;
  channel?: string;
  operatorId?: string[];
  page?: number;
  pageSize?: number;
}

export async function getEvaluationStats(options: GetEvaluationStatsOptions) {
  const res = await client.get<EvaluationStatsResult>('/statistics/evaluation', {
    params: {
      from: options.from.toISOString(),
      to: options.to.toISOString(),
      channel: options.channel,
      operatorId: options.operatorId?.join(','),
    },
  });
  return res.data;
}
