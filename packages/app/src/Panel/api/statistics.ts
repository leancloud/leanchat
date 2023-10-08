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
}

export interface GetConversationRecordStatsOptions {
  from: string;
  to: string;
}

export async function getConversationRecordStats(options: GetConversationRecordStatsOptions) {
  const res = await client.get<ConversationRecord[]>('/statistics/conversation-record', {
    params: options,
  });
  return res.data;
}
