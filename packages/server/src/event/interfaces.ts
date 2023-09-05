import type { ConversationDocument } from 'src/conversation';
import type { MessageDocument } from 'src/message';

export interface ConversationCreatedEvent {
  conversation: ConversationDocument;
}

export interface MessageCreatedEvent {
  message: MessageDocument;
}
