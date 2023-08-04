export interface IMessage<T = any> {
  id: string;
  visitorId: string;
  type: string;
  from: string;
  data: T;
  createdAt: string;
}
