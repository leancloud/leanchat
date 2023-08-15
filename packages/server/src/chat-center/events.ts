import { Conversation } from 'src/conversation';

export interface ConversationAssignedEvent {
  conversation: Conversation;
}

export interface ConversationClosedEvent {
  conversation: Conversation;
}

export interface ConversationQueuedEvent {
  conversation: Conversation;
}

export interface OperatorStatusChangedEvent {
  operatorId: string;
  status: string;
}
