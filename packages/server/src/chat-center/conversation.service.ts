import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import EventEmitter2 from 'eventemitter2';

import { REDIS } from 'src/redis';
import { Visitor, VisitorService } from 'src/visitor';
import { Operator } from 'src/operator';
import { ConversationAssignedEvent, ConversationClosedEvent } from './events';

@Injectable()
export class ConversationService {
  constructor(
    @Inject(REDIS)
    private redis: Redis,

    private visitorService: VisitorService,

    private events: EventEmitter2,
  ) {}

  getOperatorStatus(operatorId: string) {
    return this.redis.hget('operator_status', operatorId);
  }

  async assignOperator(visitor: Visitor, operator: Operator) {
    const operatorStatus = await this.getOperatorStatus(operator.id);
    if (operatorStatus !== 'ready') {
      throw new BadRequestException(`客服 ${operator.id} 不是在线状态`);
    }

    await this.visitorService.updateVisitor(visitor, {
      status: 'inProgress',
      operatorId: operator.id,
    });

    await this.redis
      .pipeline()
      .zrem('visitor_queue', visitor.id)
      .hincrby('operator_concurrency', operator.id, 1)
      .exec();

    this.events.emit('conversation.assigned', {
      visitor,
      operator,
    } satisfies ConversationAssignedEvent);
  }

  async closeConversation(visitor: Visitor) {
    const operatorId = visitor.operatorId;

    await this.visitorService.updateVisitor(visitor, {
      status: 'solved',
      operatorId: null,
    });

    if (operatorId) {
      await this.redis.hincrby('operator_concurrency', operatorId, -1);
    }

    this.events.emit('conversation.closed', {
      visitor,
    } satisfies ConversationClosedEvent);
  }

  async conversationQueued(conversationId: string) {
    const score = await this.redis.zscore('visitor_queue', conversationId);
    return score !== null;
  }

  getConversationQueueSize() {
    return this.redis.zcard('visitor_queue');
  }
}
