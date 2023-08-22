export interface IGetMessagesDto {
  visitorId?: string;
  conversationId?: string;
  types?: string[];
}

export interface TextMessageData {
  type: 'text';
  content: string;
}

export interface FileMessageData {
  type: 'file';
  name: string;
  url: string;
  mime?: string;
  size?: number;
}

export type MessageData = TextMessageData | FileMessageData;

export interface CreateMessageData {
  visitorId: string;
  conversationId: string;
  type: string;
  from: {
    type: string;
    id: string;
  };
  data: MessageData;
}
