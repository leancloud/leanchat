import { IMessage } from './interfaces';

export class Message {
  id: string;

  conversation: string;

  from: IMessage['from'];

  type: string;

  data: IMessage['data'];

  static fromJSON(json: Record<string, any>) {
    const message = new Message();
    message.id = json.objectId;
    message.conversation = json.conversation;
    message.from = json.from;
    message.type = json.type;
    message.data = json.data;
    return message;
  }
}
