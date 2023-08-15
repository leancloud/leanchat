import { Injectable } from '@nestjs/common';
import AV from 'leancloud-storage';

import { Visitor } from './visitor.entity';
import { GetVisitorsOptions, UpdateVisitorData } from './interfaces';
import { LRUCache } from 'lru-cache';

@Injectable()
export class VisitorService {
  private visitorCache = new LRUCache<string, Visitor>({
    max: 5000,
    ttl: 1000 * 60 * 15, // 15 min
  });

  async getVisitors({ conditions, orderBy, desc }: GetVisitorsOptions) {
    const query = new AV.Query('ChatVisitor');
    if (conditions.status) {
      query.equalTo('status', conditions.status);
    }
    if (conditions.operatorId) {
      query.equalTo('operatorId', conditions.operatorId);
    }
    if (conditions.operatorId === null) {
      query.doesNotExist('operatorId');
    }
    if (orderBy) {
      if (desc) {
        query.addDescending(orderBy);
      } else {
        query.addAscending(orderBy);
      }
    }
    const objs = await query.find({ useMasterKey: true });
    return objs.map((obj) => Visitor.fromAVObject(obj as AV.Object));
  }

  async getVisitor(id: string) {
    if (this.visitorCache.has(id)) {
      return this.visitorCache.get(id);
    }

    const query = new AV.Query('ChatVisitor');
    query.equalTo('objectId', id);
    const obj = await query.first({ useMasterKey: true });
    if (obj) {
      const visitor = Visitor.fromAVObject(obj as AV.Object);
      this.visitorCache.set(id, visitor);
      return visitor;
    }
  }

  async registerVisitorFromChatChannel(chatId: string) {
    const query = new AV.Query('ChatVisitor');
    query.equalTo('chatId', chatId);
    const existObj = await query.first({ useMasterKey: true });
    if (existObj) {
      return Visitor.fromAVObject(existObj);
    }

    const obj = new AV.Object('ChatVisitor', {
      channel: 'chat',
      chatId,
    });
    await obj.save(null, { useMasterKey: true });
    return Visitor.fromAVObject(obj);
  }

  async updateVisitor(visitor: Visitor, data: UpdateVisitorData) {
    const obj = AV.Object.createWithoutData('ChatVisitor', visitor.id);
    const newVisitor = visitor.clone();
    if (data.currentConversationId) {
      obj.set('currentConversationId', data.currentConversationId);
      newVisitor.currentConversationId = data.currentConversationId;
    }
    await obj.save(null, { useMasterKey: true });
    if (this.visitorCache.has(visitor.id)) {
      this.visitorCache.set(visitor.id, newVisitor);
    }
    return newVisitor;
  }
}
