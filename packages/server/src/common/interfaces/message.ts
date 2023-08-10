export interface IMessage<T = any> {
  id: string;
  visitorId: string;
  conversationId: string;
  type: string;
  from: string;
  data: T;
  createdAt: string;
}
