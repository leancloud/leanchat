import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Redis } from 'ioredis';
import _ from 'lodash';

import { REDIS } from 'src/redis';
import {
  ConversationEvaluation,
  UpdateConversationData,
} from '../interfaces/conversation.interface';
import { CreateMessageData } from '../interfaces/chat.interface';
import { ChatError } from '../errors';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import {
  AssignQueuedJobData,
  AutoAssignJobData,
  MessageSender,
} from '../interfaces';
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

    @InjectQueue('assign_queued_conversation')
    private assignQueuedQueue: Queue<AssignQueuedJobData>,
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

    const message = await this.messageService.createMessage(conversation, {
      from,
      type: 'message',
      data,
    });

    const updateConversationData: UpdateConversationData = {};
    if (from.type === 'visitor') {
      updateConversationData.visitorLastActivityAt = message.createdAt;
    } else if (from.type === 'operator') {
      updateConversationData.operatorLastActivityAt = message.createdAt;
    }

    if (!_.isEmpty(updateConversationData)) {
      await this.conversationService.updateConversation(
        conversation.id,
        updateConversationData,
      );
    }

    return message;
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

    await this.redis.zrem('conversation_queue', conversation.id);

    await this.conversationService.updateConversation(conversationId, {
      closedAt: new Date(),
    });
    await this.messageService.createMessage(conversation, {
      type: 'closeConversation',
      from,
      data: {},
    });

    if (conversation.operatorId) {
      const operatorId = conversation.operatorId.toString();
      await this.redis.hincrby('operator_workload', operatorId, -1);
      await this.assignQueuedConversationToOperator(operatorId);
    }
  }

  async setOperatorStatus(operatorId: string, status: string) {
    await this.redis.hset('operator_status', operatorId, status);

    if (status === 'ready') {
      const workload = await this.conversationService.getOpenConversationCount(
        operatorId,
      );
      await this.redis.hset('operator_workload', operatorId, workload);
      await this.assignQueuedConversationToOperator(operatorId);
    }

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
    if (!conversation || conversation.operatorId?.equals(operatorId)) {
      return;
    }
    const fromOperatorId = conversation.operatorId?.toString();

    await this.conversationService.updateConversation(conversationId, {
      operatorId,
    });

    const pl = this.redis.pipeline();
    if (fromOperatorId) {
      pl.hincrby('operator_workload', fromOperatorId, -1);
    }
    pl.hincrby('operator_workload', operatorId, 1);
    pl.zrem('conversation_queue', conversation.id);
    await pl.exec();

    if (fromOperatorId) {
      // 为原客服重新分配会话
      await this.assignQueuedConversationToOperator(fromOperatorId);
    }
  }

  @OnEvent('conversation.created', { async: true })
  async addAutoAssignJob({ conversation }: ConversationCreatedEvent) {
    const queueSize = await this.redis.zcard('conversation_queue');
    if (queueSize === 0) {
      await this.autoAssignQueue.add({
        conversationId: conversation.id,
      });
    } else {
      await this.enqueueConversation(conversation.id);
    }
  }

  async enqueueConversation(conversationId: string) {
    const queuedAt = new Date();
    const score = queuedAt.getTime();
    const added = await this.redis.zadd(
      'conversation_queue',
      'NX',
      score,
      conversationId,
    );
    if (!added) {
      return;
    }
    await this.conversationService.updateConversation(conversationId, {
      queuedAt,
    });
  }

  async dequeueConversation() {
    const [conversationId] = await this.redis.zpopmin('conversation_queue');
    return conversationId;
  }

  async addAssignQueuedConversationJob(operatorId: string, maxCount: number) {
    await this.assignQueuedQueue.add({ operatorId, maxCount });
  }

  async assignQueuedConversationToOperator(operatorId: string) {
    const operator = await this.operatorService.getOperator(operatorId);
    if (!operator) {
      return;
    }

    const results = await this.redis
      .pipeline()
      .hget('operator_status', operator.id)
      .hget('operator_workload', operator.id)
      .exec();
    if (!results) {
      return;
    }

    const status = results[0][1] as string | null;
    const workloadStr = results[1][1] as string | null;
    if (status !== 'ready' || !workloadStr) {
      return;
    }

    const workload = parseInt(workloadStr);
    if (workload < 0) {
      return;
    }

    const maxCount = operator.concurrency - workload;
    if (maxCount > 0) {
      await this.assignQueuedQueue.add({ operatorId, maxCount });
    }
  }
}
