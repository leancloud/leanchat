import type { Conversation, Message } from '../models';

export interface ConversationCreatedEvent {
  conversation: Conversation;
}

export interface MessageCreatedEvent {
  message: Message;
}
