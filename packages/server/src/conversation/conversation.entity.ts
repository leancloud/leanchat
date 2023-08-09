import { IMessage } from 'src/common/interfaces';

export class Conversation {
  id: string;

  visitorId: string;

  operatorId?: string;

  lastMessage?: IMessage;

  status: string;

  queuedAt?: Date;

  createdAt: Date;

  static fromAVObject(obj: { get: (key: string) => any }) {
    const conv = new Conversation();
    conv.id = obj.get('objectId');
    conv.visitorId = obj.get('visitorId');
    conv.operatorId = obj.get('operatorId');
    conv.lastMessage = obj.get('lastMessage');
    conv.status = obj.get('status');
    conv.queuedAt = obj.get('queuedAt');
    conv.createdAt = obj.get('createdAt');
    return conv;
  }
}
