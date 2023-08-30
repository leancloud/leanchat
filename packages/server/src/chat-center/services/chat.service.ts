import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Redis } from 'ioredis';

import { REDIS } from 'src/redis';
import { ConversationService } from 'src/conversation';
import { OperatorStatusChangedEvent } from '../events';

@Injectable()
export class ChatService {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
    private events: EventEmitter2,
    private conversationService: ConversationService,
  ) {}

  async getOperatorStatus(operatorId: string) {
    const status = await this.redis.hget('operator_status', operatorId);
    return status || 'leave';
  }

  async setOperatorStatus(operatorId: string, status: string) {
    if (status === 'ready') {
      const count = await this.conversationService.countOperatorConversations(
        operatorId,
      );
      await this.redis
        .pipeline()
        .hset('operator_status', operatorId, 'ready')
        .hset('operator_concurrency', operatorId, count)
        .exec();
    } else {
      await this.redis.hset('operator_status', operatorId, status);
    }
    this.events.emit('operator.status.changed', {
      operatorId,
      status,
    } satisfies OperatorStatusChangedEvent);
  }

  getOperatorStatuses() {
    return this.redis.hgetall('operator_status');
  }
}
