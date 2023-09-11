import { client } from './client';

export interface GetConversationStatisticsFilters {
  from: Date;
  to: Date;
  channel?: string;
  operatorId?: string[];
}

export interface ConversationStatistics {
  incoming: number;
  queued: number;
  queuedAndLeft: number;
  queuedAndProcessed: number;
  notQueued: number;
  operatorCommunicated: number;
  oneOperatorCommunicated: number;
  valid: number;
  invalid: number;
  noResponse: number;
  receptionTime: number;
  receptionCount: number;
  firstResponseTime: number;
  firstResponseCount: number;
  responseTime: number;
  responseCount: number;
  overtime: number;
  queuedAndLeftTime: number;
  queuedAndProcessedTime: number;
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
