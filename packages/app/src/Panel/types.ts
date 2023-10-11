export interface Message {
  id: string;
  visitorId: string;
  conversationId: string;
  type: string;
  from: {
    type: number;
    id: string;
  };
  data: any;
  createdAt: string;
}

export interface Conversation {
  id: string;
  visitorId: string;
  visitor?: {
    id: string;
    name?: string;
  };
  operatorId?: string;
  lastMessage?: Message;
  categoryId?: string;
  evaluation?: {
    star: number;
    feedback: string;
  };
  status: string;
  visitorWaitingSince?: string;
}

export interface Operator {
  id: string;
  username: string;
  externalName: string;
  internalName: string;
  concurrency: number;
  status: string;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
}

export interface QuickReply {
  id: string;
  content: string;
  tags?: string[];
}

export interface Visitor {
  id: string;
  name?: string;
  comment?: string;
}

export enum UserType {
  Visitor = 0,
  Operator = 1,
  System = 2,
}

export enum ConsultationResult {
  Valid = 0,
  Invalid = 1,
  OperatorNoResponse = 2,
}
