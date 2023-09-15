import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Redis } from 'ioredis';

import {
  ConversationDocument,
  ConversationService,
  ConversationStatsService,
  ConversationStatus,
} from 'src/conversation';
import { Operator, OperatorService } from 'src/operator';
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
    private convStatsService: ConversationStatsService,
    private operatorService: OperatorService,
  ) {}

  async enqueue(conv: ConversationDocument) {
    const score = await this.redis.zscore('conversation_queue', conv.id);
    if (!score) {
      return;
    }

    const queuedAt = new Date(Number(score));
    const newConv = await this.conversationService.updateConversation(conv, {
      status: ConversationStatus.Queued,
      timestamps: {
        queuedAt,
      },
    });

    this.events.emit('conversation.queued', {
      conversation: newConv,
    } satisfies ConversationQueuedEvent);
  }

  async assign(conv: ConversationDocument, operator: Operator) {
    const newConv = await this.conversationService.updateConversation(conv, {
      status: ConversationStatus.InProgress,
      operatorId: operator.id,
      timestamps: {
        operatorJoinedAt: new Date(),
      },
    });

    await this.redis.zrem('conversation_queue', conv.id);
    await this.operatorService.increaseOperatorConcurrency(operator.id);

    this.events.emit('conversation.assigned', {
      conversation: newConv,
    } satisfies ConversationAssignedEvent);
  }

  async close(conv: ConversationDocument) {
    if (conv.status === ConversationStatus.Solved) {
      return;
    }

    const closedAt = new Date();
    await this.conversationService.updateConversation(conv, {
      status: ConversationStatus.Solved,
      timestamps: {
        closedAt,
        operatorClosedAt: closedAt,
      },
    });

    if (conv.operatorId) {
      const operatorId = conv.operatorId.toString();
      await this.operatorService.increaseOperatorConcurrency(operatorId, -1);
    }

    this.events.emit('conversation.closed', {
      conversation: conv,
    } satisfies ConversationClosedEvent);

    await this.convStatsService.addStatsJob({
      conversationId: conv.id,
    });
  }
}
