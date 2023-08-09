import { Inject, Injectable } from '@nestjs/common';
import EventEmitter2 from 'eventemitter2';
import { Redis } from 'ioredis';
import { Conversation, ConversationService } from 'src/conversation';
import { Operator } from 'src/operator';

import { REDIS } from 'src/redis';
import { ConversationAssignedEvent, ConversationClosedEvent } from '../events';

@Injectable()
export class ChatConversationService {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
    private events: EventEmitter2,
    private conversationService: ConversationService,
  ) {}

  async assign(conv: Conversation, operator: Operator) {
    await this.conversationService.updateConversation(conv, {
      status: 'inProgress',
      operatorId: operator.id,
    });

    await this.redis
      .pipeline()
      .zrem('conversation_queue', conv.id)
      .hincrby('operator_concurrency', operator.id, 1)
      .exec();

    this.events.emit('conversation.assigned', {
      conversation: conv,
      operator,
    } satisfies ConversationAssignedEvent);
  }

  async close(conv: Conversation) {
    await this.conversationService.updateConversation(conv, {
      status: 'solved',
    });

    if (conv.operatorId) {
      await this.redis.hincrby('operator_concurrency', conv.operatorId, -1);
    }

    this.events.emit('conversations.closed', {
      conversation: conv,
    } satisfies ConversationClosedEvent);
  }
}
