import { Conversation } from 'src/conversation';
import { Operator } from 'src/operator';

export interface ConversationAssignedEvent {
  conversation: Conversation;
  operator: Operator;
}

export interface ConversationClosedEvent {
  conversation: Conversation;
}

export interface ConversationQueuedEvent {
  conversationId: string;
}
