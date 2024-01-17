export interface AutoAssignJobData {
  conversationId: string;
  chatbot?: boolean;
}

export interface AssignQueuedJobData {
  operatorId: string;
  maxCount: number;
}
