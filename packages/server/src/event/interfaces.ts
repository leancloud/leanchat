import type { ConversationDocument } from 'src/conversation';
import type { Message } from 'src/message';

export interface ConversationCreatedEvent {
  conversation: ConversationDocument;
}

export interface MessageCreatedEvent {
  message: Message;
}
