import { IMessage } from 'src/common/interfaces';

export interface UpdateConversationData {
  status?: string;
  operatorId?: string;
  lastMessage?: IMessage;
  queuedAt?: Date;
}

export interface GetConversationOptions {
  status?: string;
  visitorId?: string;
  operatorId?: string | null;

  sort?: string;
  desc?: boolean;
}
