import { Injectable } from '@nestjs/common';
import AV from 'leancloud-storage';

import { IMessage } from './interfaces';
import { Message } from './message.entity';

@Injectable()
export class ChatService {
  async createMessage(data: IMessage) {
    const obj = new AV.Object('ChatMessage', {
      conversation: data.conversation,
      from: data.from,
      type: data.type,
      data: data.data,
    });
    await obj.save(null, { useMasterKey: true });
    return Message.fromJSON(obj.toJSON());
  }
}
