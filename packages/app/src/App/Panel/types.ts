export interface Message {
  id: string;
  visitorId: string;
  type: string;
  from: string;
  data: {
    content: string;
  };
  createdAt: string;
}

export interface Conversation {
  id: string;
  visitorId: string;
  operatorId?: string;
  lastMessage?: Message;
}
