export interface Message {
  id: string;
  visitorId: string;
  conversationId: string;
  type: string;
  from: {
    type: 'visitor' | 'operator';
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
  status: string;
}

export interface Operator {
  id: string;
  username: string;
  externalName: string;
  internalName: string;
  concurrency: number;
  status: string;
}

export interface ChatBotNode {
  id: string;
  type: string;
  position?: {
    x: number;
    y: number;
  };
  [key: string]: any;
}

export interface ChatBotEdge {
  sourceNode: string;
  sourcePin: string;
  targetNode: string;
  targetPin: string;
}

export interface ChatBot {
  id: string;
  name: string;
  nodes: ChatBotNode[];
  edges: ChatBotEdge[];
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

export interface SkillGroup {
  id: string;
  name: string;
  memberIds: string[];
}
