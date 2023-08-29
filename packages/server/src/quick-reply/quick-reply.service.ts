import { Injectable } from '@nestjs/common';
import AV from 'leancloud-storage';

import { CreateQuickReplyData, UpdateQuickReplyData } from './interfaces';
import { QuickReply } from './quick-reply.entity';

@Injectable()
export class QuickReplyService {
  async createQuickReply(data: CreateQuickReplyData) {
    const obj = new AV.Object('ChatQuickReply', {
      content: data.content,
      tags: data.tags,
    });
    await obj.save(null, { useMasterKey: true });
    return QuickReply.fromAVObject(obj);
  }

  async getQuickReplies() {
    const query = new AV.Query('ChatQuickReply');
    query.limit(1000);
    const objs = await query.find({ useMasterKey: true });
    return objs.map(QuickReply.fromAVObject);
  }

  async getQuickReply(id: string) {
    const query = new AV.Query('ChatQuickReply');
    query.equalTo('objectId', id);
    const obj = await query.first({ useMasterKey: true });
    if (obj) {
      return QuickReply.fromAVObject(obj);
    }
  }

  async updateQuickReply(quickReply: QuickReply, data: UpdateQuickReplyData) {
    const obj = AV.Object.createWithoutData('ChatQuickReply', quickReply.id);
    if (data.content) {
      obj.set('content', data.content);
    }
    if (data.tags) {
      obj.set('tags', data.tags);
    }
    await obj.save(null, { useMasterKey: true });
  }

  async deleteQuickReply(quickReply: QuickReply) {
    const obj = AV.Object.createWithoutData('ChatQuickReply', quickReply.id);
    await obj.destroy({ useMasterKey: true });
  }
}
