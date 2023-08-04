import AV from 'leancloud-storage';

export class Visitor {
  id: string;

  channel: string;

  chatId?: string;

  status?: string;

  static fromAVObject(obj: AV.Object) {
    const json = obj.toJSON();
    const visitor = new Visitor();
    visitor.id = json.objectId;
    visitor.channel = json.channel;
    visitor.chatId = json.chatId;
    visitor.status = json.status;
    return visitor;
  }
}
