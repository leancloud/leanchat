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
  status: ConversationStatus;
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
  createdAt: string;
}

export enum OperatorRole {
  Operator = 1,
  Admin = 2,
}

export interface Operator {
  id: string;
  role: OperatorRole;
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
  Visitor = 1,
  Operator = 2,
  System = 3,
}

export enum ConsultationResult {
  Valid = 1,
  Invalid = 2,
  OperatorNoResponse = 3,
}

export enum MessageType {
  Message = 1,
  Evaluate = 2,
  Close = 3,
  Assign = 4,
  Reopen = 5,
}

export enum ConversationStatus {
  Open = 1,
  Closed = 2,
}
