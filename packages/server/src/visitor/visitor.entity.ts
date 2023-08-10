import AV from 'leancloud-storage';

export class Visitor {
  id: string;

  channel: string;

  chatId?: string;

  static fromAVObject(obj: AV.Object) {
    const json = obj.toJSON();
    const visitor = new Visitor();
    visitor.id = json.objectId;
    visitor.channel = json.channel;
    visitor.chatId = json.chatId;
    return visitor;
  }
}
