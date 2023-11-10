import { client } from '@/Panel/api/client';

interface QuerySelector<T> {
  eq?: T;
  gt?: T;
  lt?: T;
}

export interface SearchConversationOptions {
  from: string;
  to: string;

  channel?: number;
  categoryId?: string[];
  visitorId?: string[];
  operatorId?: string[];
  closedBy?: number;
  evaluation?: {
    invited?: boolean;
    star?: number;
  };
  message?: {
    text?: string;
    from?: number;
  };
  duration?: QuerySelector<number>;
  averageResponseTime?: QuerySelector<number>;
  queued?: boolean;
  consultationResult?: number;

  page?: number;
  pageSize?: number;
}

export interface ConversationData {
  id: string;
  createdAt: string;
  queuedAt?: string;
  closedAt?: string;
  closedBy?: {
    type: number;
    id?: string;
  };
  categoryId?: string;
  visitorId?: string;
  visitorName?: string;
  operatorId?: string;
  evaluation?: {
    star: number;
    feedback: string;
  };
  evaluationInvitedAt?: string;
  joinedOperatorIds?: string[];
  stats?: {
    visitorMessageCount?: number;
    operatorMessageCount?: number;
    firstResponseTime?: number;
    maxResponseTime?: number;
    responseTime?: number;
    responseCount?: number;
    averageResponseTime?: number;
    receptionTime?: number;
    firstOperatorJoinedAt?: string;
    reassigned?: boolean;
    operatorFirstMessageCreatedAt?: string;
    operatorLastMessageCreatedAt?: string;
    visitorFirstMessageCreatedAt?: string;
    visitorLastMessageCreatedAt?: string;
    queueConnectionTime?: number;
    queueTimeToLeave?: number;
    consultationResult?: number;
    duration?: number;
  };
}

export interface SearchConversationResult {
  data: ConversationData[];
  totalCount: number;
}

export async function searchConversation(options: SearchConversationOptions) {
  const res = await client.post<SearchConversationResult>('/conversation.search', options);
  return res.data;
}
