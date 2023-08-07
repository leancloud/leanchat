import AV from 'leancloud-storage';

import { IMessage } from 'src/common/interfaces';

export class Visitor {
  id: string;

  channel: string;

  chatId?: string;

  recentMessage?: IMessage;

  status?: string;

  operatorId?: string;

  static fromAVObject(obj: AV.Object) {
    const json = obj.toJSON();
    const visitor = new Visitor();
    visitor.id = json.objectId;
    visitor.channel = json.channel;
    visitor.chatId = json.chatId;
    visitor.recentMessage = json.recentMessage;
    visitor.status = json.status;
    visitor.operatorId = json.operatorId;
    return visitor;
  }
}
