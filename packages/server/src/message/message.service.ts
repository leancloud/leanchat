import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import AV from 'leancloud-storage';

import { Message } from './message.entity';
import { CreateMessageData, IGetMessagesDto } from './interfaces';

@Injectable()
export class MessageService {
  constructor(private events: EventEmitter2) {}

  async createMessage(data: CreateMessageData) {
    const obj = new AV.Object('ChatMessage', {
      visitorId: data.visitorId,
      conversationId: data.conversationId,
      type: data.type,
      from: data.from,
      data: data.data,
    });
    await obj.save(null, { useMasterKey: true });

    const message = Message.fromAVObject(obj);

    this.events.emit('message.created', { message });

    return message;
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
