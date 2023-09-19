import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Redis } from 'ioredis';

import { REDIS } from 'src/redis';
import { ConversationEvaluation } from '../interfaces/conversation.interface';
import { CreateMessageData } from '../interfaces/chat.interface';
import { ChatError } from '../errors';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import { MessageSender } from '../interfaces';
import { OperatorStatusChangedEvent } from '../events';

@Injectable()
export class ChatService {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
    private events: EventEmitter2,
    private conversationService: ConversationService,
    private messageService: MessageService,
  ) {}

  async createMessage({ conversationId, from, data }: CreateMessageData) {
    const conversation = await this.conversationService.getConversation(
      conversationId,
    );
    if (!conversation) {
      throw new ChatError('CONVERSATION_NOT_EXIST');
    }
    if (conversation.closedAt) {
      throw new ChatError('CONVERSATION_CLOSED');
    }

    return this.messageService.createMessage(conversation, {
      from,
      type: 'message',
      data,
    });
  }

  async evaluateConversation(
    conversationId: string,
    evaluation: ConversationEvaluation,
  ) {
    const conversation = await this.conversationService.getConversation(
      conversationId,
    );
    if (!conversation) {
      throw new ChatError('CONVERSATION_NOT_EXIST');
    }
    if (conversation.evaluation) {
      throw new ChatError('CONVERSATION_EVALUATED');
    }

    await this.conversationService.updateConversation(conversationId, {
      evaluation,
    });
    await this.messageService.createMessage(conversation, {
      type: 'evaluate',
      from: {
        type: 'visitor',
        id: conversation.visitorId,
      },
      data: { evaluation },
    });
  }

  async closeConversation(conversationId: string, from: MessageSender) {
    const conversation = await this.conversationService.getConversation(
      conversationId,
    );
    if (!conversation) {
      throw new ChatError('CONVERSATION_NOT_EXIST');
    }
    if (conversation.closedAt) {
      return;
    }

    await this.conversationService.updateConversation(conversationId, {
      closedAt: new Date(),
    });
    await this.messageService.createMessage(conversation, {
      type: 'closeConversation',
      from,
      data: {},
    });
  }

  async setOperatorStatus(operatorId: string, status: string) {
    await this.redis.hset('operator_status', operatorId, status);
    this.events.emit('operator.statusChanged', {
      operatorId,
      status,
    } satisfies OperatorStatusChangedEvent);
  }

  async getOperatorStatuses(operatorIds?: string[]) {
    if (!operatorIds) {
      return this.redis.hgetall('operator_status');
    }
    const statuses = await this.redis.hmget('operator_status', ...operatorIds);
    return operatorIds.reduce<Record<string, string>>(
      (map, operatorId, index) => {
        const status = statuses[index];
        if (status !== null) {
          map[operatorId] = status;
        }
        return map;
      },
      {},
    );
  }

  getOperatorStatus(operatorId: string) {
    return this.redis.hget('operator_status', operatorId);
  }
}
