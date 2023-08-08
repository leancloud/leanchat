import { Operator } from 'src/operator';
import { Visitor } from 'src/visitor';

export interface ConversationAssignedEvent {
  visitor: Visitor;
  operator: Operator;
}

export interface ConversationClosedEvent {
  visitor: Visitor;
}

export interface ConversationQueuedEvent {
  visitorId: string;
}
