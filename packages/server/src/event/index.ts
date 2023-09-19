import type { Conversation } from 'src/chat';

export * from './interfaces';

export interface InviteEvaluationEvent {
  conversation: Conversation;
}
