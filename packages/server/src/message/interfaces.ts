import { Types } from 'mongoose';

export interface IGetMessagesDto {
  visitorId?: string;
  conversationId?: string;
  type?: string | string[];
  limit?: number;
  desc?: boolean;
  cursor?: Date;
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

export interface LogMessageData {
  type: 'evaluated';
  [key: string]: any;
}

export type MessageData = TextMessageData | FileMessageData | LogMessageData;

export interface CreateMessageData {
  visitorId: Types.ObjectId | string;
  conversationId: string;
  type: string;
  from: {
    type: string;
    id?: string;
  };
  data: MessageData;
}
