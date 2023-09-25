export interface Message {
  id: string;
  visitorId: string;
  conversationId: string;
  type: string;
  from: {
    type: 'visitor' | 'operator' | 'system';
    id: string;
  };
  data: any;
  createdAt: string;
}

export interface Conversation {
  id: string;
  visitorId: string;
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
