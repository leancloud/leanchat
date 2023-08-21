export interface Message {
  id: string;
  visitorId: string;
  conversationId: string;
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
