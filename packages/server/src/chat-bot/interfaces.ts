interface BaseChatBodeNode {
  id: string;
  next: string[];
}

export interface OnConversationCreated extends BaseChatBodeNode {
  type: 'onConversationCreated';
}

export interface DoSendMessage extends BaseChatBodeNode {
  type: 'doSendMessage';
  message: {
    content: string;
  };
}

export type ChatBotNode = OnConversationCreated | DoSendMessage;

export interface CreateChatBotData {
  name: string;
  nodes: any[];
}
