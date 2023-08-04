import { Injectable } from '@nestjs/common';
import AV from 'leancloud-storage';

import { Visitor } from './visitor.entity';
import { IUpdateVisitorDto } from './interfaces';

@Injectable()
export class VisitorService {
  async registerVisitorFromChatChannel(chatId: string) {
    const query = new AV.Query('ChatVisitor');
    query.equalTo('chatId', chatId);
    const existObj = await query.first({ useMasterKey: true });
    if (existObj) {
      return Visitor.fromAVObject(existObj as AV.Object);
    }

    const obj = new AV.Object('ChatVisitor', {
      channel: 'chat',
      chatId,
    });
    await obj.save(null, { useMasterKey: true });
    return Visitor.fromAVObject(obj);
  }

  async updateVisitor(id: string, data: IUpdateVisitorDto) {
    const obj = AV.Object.createWithoutData('ChatVisitor', id);
    if (data.status) {
      obj.set('status', data.status);
    }
    if (data.recentMessage) {
      obj.set('recentMessage', data.recentMessage);
    }
    await obj.save(null, { useMasterKey: true });
  }
}
