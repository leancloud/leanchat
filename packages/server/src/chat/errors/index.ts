export type ChatErrorCode =
  | 'CONVERSATION_NOT_EXIST'
  | 'CONVERSATION_EVALUATED'
  | 'CONVERSATION_CLOSED'
  | 'VISITOR_NOT_EXIST'
  | 'OPERATOR_NOT_EXIST';

export class ChatError extends Error {
  constructor(
    readonly code: ChatErrorCode,
    message?: string,
  ) {
    super(message || code);
  }
}
