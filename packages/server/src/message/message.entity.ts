export class Message {
  id: string;

  visitorId: string;

  conversationId: string;

  type: string;

  from: {
    type: string;
    id: string;
  };

  data: any;

  createdAt: Date;

  static fromAVObject(obj: { get(key: string): any }) {
    const message = new Message();
    message.id = obj.get('objectId');
    message.visitorId = obj.get('visitorId');
    message.conversationId = obj.get('conversationId');
    message.type = obj.get('type');
    message.from = obj.get('from');
    message.data = obj.get('data');
    message.createdAt = obj.get('createdAt');
    return message;
  }
}
