interface BaseChatBodeNode {
  id: string;
}

export interface OnConversationCreated extends BaseChatBodeNode {
  type: 'onConversationCreated';
}

export interface DoSendMessageConfig extends BaseChatBodeNode {
  type: 'doSendMessage';
  message: {
    content: string;
  };
}

export interface ChatBotContext {
  conversationId: string;
}

export type ChatBotNode = OnConversationCreated | DoSendMessageConfig;

export interface ChatBotEdge {
  sourceNode: string;
  sourcePin: string;
  targetNode: string;
  targetPin: string;
}

export interface CreateChatBotData {
  name: string;
  nodes: ChatBotNode[];
  edges: ChatBotEdge[];
}

export interface UpdateChatBotData {
  name?: string;
  nodes?: ChatBotNode[];
  edges?: ChatBotEdge[];
}

export interface ChatBotDispatchJobData {
  type: string;
  context: ChatBotContext;
}

export interface ChatBotProcessJobData {
  chatBotId: string;
  nodeId: string;
  nodes: ChatBotNode[];
  edges: ChatBotEdge[];
  context: ChatBotContext;
}
