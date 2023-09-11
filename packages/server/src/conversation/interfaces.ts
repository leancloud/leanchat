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

export interface ConversationStatistics {
  // 总进线量
  incoming: number;
  // 排队会话数
  queued: number;
  // 排队离开会话数
  queuedAndLeft: number;
  // 排队接通会话数
  queuedAndProcessed: number;
  // 未排队会话
  notQueued: number;
  // 人工接待用户数
  operatorCommunicated: number;
  // 人工独立接待会话数
  oneOperatorCommunicated: number;
  // 人工有效会话
  valid: number;
  // 人工无效会话
  invalid: number;
  // 客服无应答会话
  noResponse: number;
  // 人工接待时长
  receptionTime: number;
  // 人工接待次数
  receptionCount: number;
  // 首次响应时长(ms)
  firstResponseTime: number;
  // 首次响应次数
  firstResponseCount: number;
  // 响应时长
  responseTime: number;
  // 响应次数
  responseCount: number;
  // 首次回复超时数量
  overtime: number;
  // 排队接通时长
  queuedAndLeftTime: number;
  // 排队离开时长
  queuedAndProcessedTime: number;
}

export interface ConversationMessageStatistics {
  /**
   * 客服消息数
   */
  operatorMessageCount: number;
  /**
   * 用户消息数
   */
  visitorMessageCount: number;
}
