import { Injectable } from '@nestjs/common';
import AV from 'leancloud-storage';

import { IMessage } from 'src/common/interfaces';
import { Message } from './message.entity';

@Injectable()
export class ChatService {
  async createMessage(data: Omit<IMessage, 'id' | 'createdAt'>) {
    const obj = new AV.Object('ChatMessage', {
      visitorId: data.visitorId,
      type: data.type,
      from: data.from,
      data: data.data,
    });
    await obj.save(null, { useMasterKey: true });
    return Message.fromAVObject(obj);
  }
}
