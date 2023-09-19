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
  evaluation?: ConversationEvaluation;
  closedAt?: Date;
  queuedAt?: Date;
}
