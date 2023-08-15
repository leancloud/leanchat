export interface IGetMessagesDto {
  visitorId?: string;
  conversationId?: string;
  types?: string[];
}

export interface CreateMessageData {
  visitorId: string;
  conversationId: string;
  type: string;
  from: string;
  data: any;
}
