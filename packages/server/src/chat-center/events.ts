import { ConversationDocument } from 'src/conversation';

export interface ConversationAssignedEvent {
  conversation: ConversationDocument;
}

export interface ConversationClosedEvent {
  conversation: ConversationDocument;
}

export interface ConversationQueuedEvent {
  conversation: ConversationDocument;
}
