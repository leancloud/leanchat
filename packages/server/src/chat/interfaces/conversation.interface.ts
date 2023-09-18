export interface CreateConversationData {
  channel: string;
  visitorId: string;
}

export interface ConversationEvaluation {
  star: number;
  feedback: string;
}

export interface UpdateConversationData {
  evaluation?: ConversationEvaluation;
  closedAt?: Date;
}
