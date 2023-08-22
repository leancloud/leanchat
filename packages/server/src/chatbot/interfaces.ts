import { MessageData } from 'src/message/interfaces';

interface BaseChatBodeNode {
  id: string;
}

export interface OnConversationCreated extends BaseChatBodeNode {
  type: 'onConversationCreated';
}

export interface OnVisitorInactive extends BaseChatBodeNode {
  type: 'onVisitorInactive';
  inactiveDuration: number;
  repeatInterval: number;
}

export interface DoSendMessage extends BaseChatBodeNode {
  type: 'doSendMessage';
  message: MessageData;
}

export interface DoCloseConversation extends BaseChatBodeNode {
  type: 'doCloseConversation';
}

export interface ChatbotContext {
  conversationId: string;
}

export type ChatbotNode =
  | OnConversationCreated
  | OnVisitorInactive
  | DoSendMessage
  | DoCloseConversation;

export interface ChatbotEdge {
  sourceNode: string;
  sourcePin: string;
  targetNode: string;
  targetPin: string;
}

export interface CreateChatbotData {
  name: string;
  nodes: ChatbotNode[];
  edges: ChatbotEdge[];
}

export interface UpdateChatbotData {
  name?: string;
  nodes?: ChatbotNode[];
  edges?: ChatbotEdge[];
}

export interface ChatbotDispatchJobData {
  type: string;
  context: ChatbotContext;
}

export interface ChatbotProcessJobData {
  chatbotId: string;
  nodeId: string;
  nodes: ChatbotNode[];
  edges: ChatbotEdge[];
  context: ChatbotContext;
}
