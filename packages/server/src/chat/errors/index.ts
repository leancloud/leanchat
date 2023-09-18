export type ChatErrorCode =
  | 'CONVERSATION_NOT_EXIST'
  | 'CONVERSATION_EVALUATED'
  | 'CONVERSATION_CLOSED';

export class ChatError extends Error {
  constructor(
    readonly code: ChatErrorCode,
    message?: string,
  ) {
    super(message || code);
  }
}
