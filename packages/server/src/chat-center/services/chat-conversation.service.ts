import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Redis } from 'ioredis';
import { ConversationDocument, ConversationService } from 'src/conversation';
import { Operator } from 'src/operator';

import { REDIS } from 'src/redis';
import {
  ConversationAssignedEvent,
  ConversationClosedEvent,
  ConversationQueuedEvent,
} from '../events';

@Injectable()
export class ChatConversationService {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
    private events: EventEmitter2,
    private conversationService: ConversationService,
  ) {}

  async enqueue(conv: ConversationDocument) {
    const score = await this.redis.zscore('conversation_queue', conv.id);
    if (!score) {
      return;
    }
    const newConv = await this.conversationService.updateConversation(conv, {
      status: 'queued',
      queuedAt: new Date(Number(score)),
    });
    this.events.emit('conversation.queued', {
      conversation: newConv,
    } satisfies ConversationQueuedEvent);
  }

  async assign(conv: ConversationDocument, operator: Operator) {
    const newConv = await this.conversationService.updateConversation(conv, {
      status: 'inProgress',
      operatorId: operator.id,
    });

    await this.redis
      .pipeline()
      .zrem('conversation_queue', conv.id)
      .hincrby('operator_concurrency', operator.id, 1)
      .exec();

    this.events.emit('conversation.assigned', {
      conversation: newConv,
    } satisfies ConversationAssignedEvent);
  }

  async close(conv: ConversationDocument) {
    const newConv = await this.conversationService.updateConversation(conv, {
      status: 'solved',
    });

    if (conv.operator) {
      await this.redis.hincrby(
        'operator_concurrency',
        conv.operator._id.toString(),
        -1,
      );
    }

    this.events.emit('conversation.closed', {
      conversation: newConv,
    } satisfies ConversationClosedEvent);
  }
}
