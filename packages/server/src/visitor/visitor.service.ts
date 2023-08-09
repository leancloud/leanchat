import { Injectable } from '@nestjs/common';
import AV from 'leancloud-storage';

import { Visitor } from './visitor.entity';
import { GetVisitorsOptions, IUpdateVisitorDto } from './interfaces';
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

  getVisitorCountForOperator(operatorId: string) {
    const query = new AV.Query('ChatVisitor');
    query.equalTo('operatorId', operatorId);
    return query.count({ useMasterKey: true });
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
      return Visitor.fromAVObject(existObj as AV.Object);
    }

    const obj = new AV.Object('ChatVisitor', {
      channel: 'chat',
      chatId,
    });
    await obj.save(null, { useMasterKey: true });
    return Visitor.fromAVObject(obj);
  }

  async updateVisitor(visitor: Visitor, data: IUpdateVisitorDto) {
    const obj = AV.Object.createWithoutData('ChatVisitor', visitor.id);
    if (data.status) {
      obj.set('status', data.status);
    }
    if (data.recentMessage) {
      obj.set('recentMessage', data.recentMessage);
    }
    if (data.operatorId) {
      obj.set('operatorId', data.operatorId);
    }
    if (data.operatorId === null) {
      obj.unset('operatorId');
    }
    if (data.queuedAt) {
      obj.set('queuedAt', data.queuedAt);
    }
    await obj.save(null, { useMasterKey: true });
    this.visitorCache.delete(visitor.id);
  }
}
