import { Injectable } from '@nestjs/common';
import AV from 'leancloud-storage';

import { IMessage } from 'src/common/interfaces';
import { Message } from './message.entity';
import { IGetMessagesDto } from './interfaces';

@Injectable()
export class MessageService {
  async createMessage(data: Omit<IMessage, 'id' | 'createdAt'>) {
    const obj = new AV.Object('ChatMessage', {
      visitorId: data.visitorId,
      conversationId: data.conversationId,
      type: data.type,
      from: data.from,
      data: data.data,
    });
    await obj.save(null, { useMasterKey: true });
    return Message.fromAVObject(obj);
  }

  async getMessages({ visitorId, conversationId, types }: IGetMessagesDto) {
    const query = new AV.Query('ChatMessage');
    if (visitorId) {
      query.equalTo('visitorId', visitorId);
    }
    if (conversationId) {
      query.equalTo('conversationId', conversationId);
    }
    if (types) {
      query.containedIn('type', types);
    }
    const objs = await query.find({ useMasterKey: true });
    return objs.map((obj) => Message.fromAVObject(obj as AV.Object));
  }
}
