export interface IMessage {
  id: string;
  type: string;
  from: {
    type: string;
    id?: string;
  };
  data: any;
}

export interface IConversation {
  id: string;
  visitorId: string;
  operatorId?: string;
  lastMessage?: IMessage;
  status: string;
  queuedAt?: Date;
  visitorLastActivityAt?: Date;
  evaluation?: {
    star: number;
    feedback: string;
  };
  createdAt: Date;
}
