import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Redis } from 'ioredis';
import _ from 'lodash';

import { REDIS } from 'src/redis';
import { ConversationEvaluation } from '../interfaces/conversation.interface';
import { CreateMessageData } from '../interfaces/chat.interface';
import { ChatError } from '../errors';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import { AutoAssignJobData, MessageSender } from '../interfaces';
import {
  ConversationCreatedEvent,
  OperatorStatusChangedEvent,
} from '../events';
import { OperatorService } from './operator.service';

@Injectable()
export class ChatService {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
    private events: EventEmitter2,
    private conversationService: ConversationService,
    private messageService: MessageService,
    private operatorService: OperatorService,

    @InjectQueue('auto_assign_conversation')
    private autoAssignQueue: Queue<AutoAssignJobData>,
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

  async getOperatorWorkloads(operatorIds: string[]) {
    const workloads = await this.redis.hmget(
      'operator_workload',
      ...operatorIds,
    );
    return operatorIds.reduce<Record<string, number>>(
      (map, operatorId, index) => {
        const workload = workloads[index];
        if (workload !== null) {
          map[operatorId] = parseInt(workload);
        }
        return map;
      },
      {},
    );
  }

  async getRandomReadyOperator() {
    const operatorStatuses = await this.getOperatorStatuses();
    const readyOperatorIds = Object.keys(operatorStatuses).filter(
      (operatorId) => operatorStatuses[operatorId] === 'ready',
    );
    if (readyOperatorIds.length === 0) {
      return;
    }

    const readyOperators = await this.operatorService.getOperators(
      readyOperatorIds,
    );
    if (readyOperators.length === 0) {
      return;
    }

    const workloads = await this.getOperatorWorkloads(
      readyOperators.map((o) => o.id),
    );

    for (const operator of _.shuffle(readyOperators)) {
      const workload = workloads[operator.id];
      if (workload !== undefined && workload < operator.concurrency) {
        return operator;
      }
    }
  }

  async assignConversation(conversationId: string, operatorId: string) {
    const conversation = await this.conversationService.getConversation(
      conversationId,
    );
    if (!conversation) {
      return;
    }

    await this.conversationService.updateConversation(conversationId, {
      operatorId,
    });

    const pl = this.redis.pipeline();
    if (conversation.operatorId) {
      pl.hincrby('operator_workload', conversation.operatorId.toString(), -1);
    }
    pl.hincrby('operator_workload', operatorId, 1);
    await pl.exec();
  }

  @OnEvent('conversation.created', { async: true })
  addAutoAssignJob(payload: ConversationCreatedEvent) {
    this.autoAssignQueue.add({
      conversationId: payload.conversation.id,
    });
  }
}
