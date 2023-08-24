import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import AV from 'leancloud-storage';
import { LRUCache } from 'lru-cache';

import { ConversationCreatedEvent } from 'src/event';
import { MessageService } from 'src/message';
import { Conversation } from './conversation.entity';
import {
  EvaluateConversationData,
  GetConversationOptions,
  UpdateConversationData,
} from './interfaces';

@Injectable()
export class ConversationService {
  private cache = new LRUCache<string, Conversation>({
    max: 5000,
    ttl: 1000 * 60 * 5,
  });

  constructor(
    private events: EventEmitter2,
    private messageService: MessageService,
  ) {}

  async createConversation(visitorId: string) {
    const obj = new AV.Object('ChatConversation', {
      visitorId,
      status: 'new',
    });
    await obj.save(null, { useMasterKey: true });

    const conversation = Conversation.fromAVObject(obj);

    this.events.emit('conversation.created', {
      conversation,
    } satisfies ConversationCreatedEvent);

    return conversation;
  }

  async getActiveConversationForVisitor(visitorId: string) {
    const query = new AV.Query('ChatConversation');
    query.equalTo('visitorId', visitorId);
    query.notEqualTo('status', 'solved');
    query.addDescending('createdAt');
    const obj = await query.first({ useMasterKey: true });
    if (obj) {
      return Conversation.fromAVObject(obj);
    }
  }

  private async getConversationObject(id: string) {
    const query = new AV.Query('ChatConversation');
    query.equalTo('objectId', id);
    return query.first({ useMasterKey: true });
  }

  async getConversation(id: string) {
    const cached = this.cache.get(id);
    if (cached) {
      return cached;
    }

    const obj = await this.getConversationObject(id);
    if (obj) {
      return Conversation.fromAVObject(obj);
    }
  }

  async updateConversation(conv: Conversation, data: UpdateConversationData) {
    const obj = AV.Object.createWithoutData('ChatConversation', conv.id);
    const newConv = conv.clone();
    if (data.operatorId) {
      obj.set('operatorId', data.operatorId);
      newConv.operatorId = data.operatorId;
    }
    if (data.status) {
      obj.set('status', data.status);
      newConv.status = data.status;
    }
    if (data.queuedAt) {
      obj.set('queuedAt', data.queuedAt);
      newConv.queuedAt = data.queuedAt;
    }
    if (data.lastMessage) {
      obj.set('lastMessage', data.lastMessage);
      newConv.lastMessage = data.lastMessage;
    }
    if (data.visitorLastActivityAt) {
      obj.set('visitorLastActivityAt', data.visitorLastActivityAt);
      newConv.visitorLastActivityAt = data.visitorLastActivityAt;
    }
    if (data.evaluation) {
      obj.set('evaluation', data.evaluation);
      newConv.evaluation = data.evaluation;
    }
    await obj.save(null, { useMasterKey: true });
    if (this.cache.has(conv.id)) {
      this.cache.set(conv.id, newConv);
    }
    return newConv;
  }

  async getConversations({
    status,
    visitorId,
    operatorId,
    sort = 'createdAt',
    desc = false,
    limit,
  }: GetConversationOptions) {
    const query = new AV.Query('ChatConversation');
    if (status) {
      query.equalTo('status', status);
    }
    if (visitorId) {
      query.equalTo('visitorId', visitorId);
    }
    if (operatorId) {
      query.equalTo('operatorId', operatorId);
    }
    if (operatorId === null) {
      query.doesNotExist('operatorId');
    }

    if (desc) {
      query.addDescending(sort);
    } else {
      query.addAscending(sort);
    }

    if (limit) {
      query.limit(limit);
    }

    const objs = await query.find({ useMasterKey: true });
    return objs.map(Conversation.fromAVObject);
  }

  countOperatorConversations(operatorId: string) {
    const query = new AV.Query('ChatConversation');
    query.equalTo('operatorId', operatorId);
    query.equalTo('status', 'inProgress');
    return query.count({ useMasterKey: true });
  }

  async evaluateConversation(
    conv: Conversation,
    evaluation: EvaluateConversationData,
  ) {
    await this.updateConversation(conv, {
      evaluation,
    });
    await this.messageService.createMessage({
      visitorId: conv.visitorId,
      conversationId: conv.id,
      type: 'log',
      from: {
        type: 'system',
      },
      data: {
        type: 'evaluated',
      },
    });
  }
}
