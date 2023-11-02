export interface Message {
  id: string;
  visitorId: string;
  conversationId: string;
  type: number;
  from: {
    type: number;
    id: string;
  };
  data: any;
  createdAt: string;
}

export interface Evaluation {
  star: number;
  feedback: string;
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
  evaluation?: Evaluation;
  visitorWaitingSince?: string;
  closedAt?: string;
  createdAt: string;
}

export interface Operator {
  id: string;
  username: string;
  externalName: string;
  internalName: string;
  concurrency: number;
  status: number;
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

export enum MessageType {
  Message = 0,
  Evaluate = 1,
  Close = 2,
  Assign = 3,
}
