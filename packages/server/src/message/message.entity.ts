import AV from 'leancloud-storage';

export class Message {
  id: string;

  visitorId: string;

  conversationId: string;

  type: string;

  from: string;

  data: any;

  createdAt: string;

  static fromAVObject(obj: AV.Object) {
    const json = obj.toJSON();
    const message = new Message();
    message.id = json.objectId;
    message.visitorId = json.visitorId;
    message.conversationId = json.conversationId;
    message.type = json.type;
    message.from = json.from;
    message.data = json.data;
    message.createdAt = json.createdAt;
    return message;
  }
}
