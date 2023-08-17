import type { Conversation } from 'src/conversation';
import type { Message } from 'src/message';

export interface ConversationCreatedEvent {
  conversation: Conversation;
}

export interface MessageCreatedEvent {
  message: Message;
}
