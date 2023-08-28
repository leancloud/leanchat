import { Message } from 'src/message';

export class Conversation {
  id: string;

  visitorId: string;

  operatorId?: string;

  lastMessage?: Message;

  status: string;

  queuedAt?: Date;

  visitorLastActivityAt?: Date;

  evaluation?: {
    star: number;
    feedback: string;
  };

  categoryId?: string;

  createdAt: Date;

  static fromAVObject(obj: { get(key: string): any }) {
    const conv = new Conversation();
    conv.id = obj.get('objectId');
    conv.visitorId = obj.get('visitorId');
    conv.operatorId = obj.get('operatorId');
    conv.lastMessage = obj.get('lastMessage');
    conv.status = obj.get('status');
    conv.queuedAt = obj.get('queuedAt');
    conv.visitorLastActivityAt = obj.get('visitorLastActivityAt');
    conv.evaluation = obj.get('evaluation');
    conv.categoryId = obj.get('categoryId');
    conv.createdAt = obj.get('createdAt');
    return conv;
  }

  clone() {
    const conv = new Conversation();
    conv.id = this.id;
    conv.visitorId = this.visitorId;
    conv.operatorId = this.operatorId;
    conv.lastMessage = this.lastMessage;
    conv.status = this.status;
    conv.queuedAt = this.queuedAt;
    conv.visitorLastActivityAt = this.visitorLastActivityAt;
    conv.evaluation = this.evaluation;
    conv.categoryId = this.categoryId;
    conv.createdAt = this.createdAt;
    return conv;
  }
}
