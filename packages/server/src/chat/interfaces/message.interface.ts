export interface CreateMessageData {
  visitorId: string;
  conversationId: string;
  from: {
    type: 'visitor' | 'operator';
    id: string;
  };
  type: 'message';
  data: {
    text?: string;
  };
}
