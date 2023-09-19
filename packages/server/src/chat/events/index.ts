import { UpdateConversationData } from '../interfaces';
import type { Conversation, Message } from '../models';

export interface ConversationCreatedEvent {
  conversation: Conversation;
}

export interface ConversationUpdatedEvent {
  conversation: Conversation;
  data: UpdateConversationData;
}

export interface MessageCreatedEvent {
  message: Message;
}
