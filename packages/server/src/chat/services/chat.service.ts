import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Redis } from 'ioredis';
import _ from 'lodash';
import Handlebars from 'handlebars';
import { differenceInDays } from 'date-fns';

import { REDIS } from 'src/redis';
import { ConfigService } from 'src/config';
import {
  CloseConversationOptions,
  ConversationEvaluation,
  ConversationStatsJobData,
  UpdateConversationData,
} from '../interfaces/conversation.interface';
import { CreateMessageData } from '../interfaces/chat.interface';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import { AssignQueuedJobData, AutoAssignJobData } from '../interfaces';
import {
  ConversationCreatedEvent,
  OperatorStatusChangedEvent,
} from '../events';
import { OperatorService } from './operator.service';
import { Conversation, Operator } from '../models';
import { MessageType, OperatorStatus, UserType } from '../constants';
import { UserInfo } from '../interfaces/common';
import { PostprocessingLogService } from './postprocessing-log.service';

@Injectable()
export class ChatService {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
    private events: EventEmitter2,
    private conversationService: ConversationService,
    private messageService: MessageService,
    private operatorService: OperatorService,
    private configService: ConfigService,
    private ppLogService: PostprocessingLogService,

    @InjectQueue('auto_assign_conversation')
    private autoAssignQueue: Queue<AutoAssignJobData>,

    @InjectQueue('assign_queued_conversation')
    private assignQueuedQueue: Queue<AssignQueuedJobData>,

    @InjectQueue('conversation_stats')
    private conversationStatsQueue: Queue<ConversationStatsJobData>,
  ) {}

  async createMessage({ conversationId, from, data }: CreateMessageData) {
    const conversation = await this.conversationService.getConversation(
      conversationId,
    );
    if (!conversation || conversation.closedAt) {
      return;
    }

    const message = await this.messageService.createMessage(conversation, {
      from,
      type: MessageType.Message,
      data,
    });

    const convData: UpdateConversationData = {};
    if (from.type === UserType.Visitor) {
      convData.visitorLastActivityAt = message.createdAt;
      if (!conversation.visitorWaitingSince) {
        convData.visitorWaitingSince = message.createdAt;
      }
    }
    if (from.type === UserType.Operator) {
      convData.operatorLastActivityAt = message.createdAt;
      convData.visitorWaitingSince = null;
    }

    await this.conversationService.updateConversation(
      conversation.id,
      convData,
    );

    return message;
  }

  private async createOperatorWelcomeMessage(
    conversation: Conversation,
    operator: Operator,
  ) {
    const welcomeMessage = await this.configService.get(
      'operatorWelcomeMessage',
    );
    if (!welcomeMessage || !welcomeMessage.enabled) {
      return;
    }

    const template = Handlebars.compile(welcomeMessage.text);
    const text = template({
      operator: {
        name: operator.externalName,
      },
    });

    await this.createMessage({
      conversationId: conversation.id,
      from: {
        type: UserType.System,
      },
      data: { text },
    });
  }

  async evaluateConversation(
    conversationId: string,
    evaluation: ConversationEvaluation,
  ) {
    const conversation = await this.conversationService.getConversation(
      conversationId,
    );
    if (!conversation || conversation.evaluation) {
      return;
    }
    if (
      conversation.closedAt &&
      differenceInDays(new Date(), conversation.closedAt) >= 7
    ) {
      // 会话关闭超过 7 天后不允许评价
      return;
    }

    await this.conversationService.updateConversation(conversationId, {
      evaluation,
    });
    await this.messageService.createMessage(conversation, {
      type: MessageType.Evaluate,
      from: {
        type: UserType.Visitor,
        id: conversation.visitorId,
      },
      data: { evaluation },
    });
  }

  async closeConversation({ conversationId, by }: CloseConversationOptions) {
    const conversation = await this.conversationService.getConversation(
      conversationId,
    );
    if (!conversation || conversation.closedAt) {
      return;
    }

    await this.redis.zrem('conversation_queue', conversation.id);

    await this.conversationService.updateConversation(conversationId, {
      closedAt: new Date(),
      closedBy: by,
    });
    await this.messageService.createMessage(conversation, {
      type: MessageType.Close,
      from: by,
    });
    await this.conversationStatsQueue.add({
      conversationId: conversation.id,
    });

    if (conversation.operatorId) {
      const operatorId = conversation.operatorId.toString();
      await this.operatorService.increaseOperatorWorkload(operatorId, -1);
      await this.assignQueuedConversationToOperator(operatorId);
    }
  }

  async setOperatorStatus(operatorId: string, status: OperatorStatus) {
    const operator = await this.operatorService.getOperator(operatorId);
    if (!operator) {
      return;
    }

    if (status === OperatorStatus.Busy && !operator.workload) {
      status = OperatorStatus.Leave;
    }

    if (operator.status === status) {
      return;
    }

    const statusUpdatedAt = new Date();
    if (status === OperatorStatus.Ready) {
      const workload = await this.conversationService.getOpenConversationCount(
        operatorId,
      );
      await this.operatorService.updateOperator(operatorId, {
        workload,
        status,
        statusUpdatedAt,
      });
    } else {
      await this.operatorService.updateOperator(operatorId, {
        status,
        statusUpdatedAt,
      });
    }

    if (status === OperatorStatus.Ready) {
      await this.assignQueuedConversationToOperator(operatorId);
    }

    if (
      status === OperatorStatus.Leave &&
      operator.status === OperatorStatus.Busy &&
      operator.statusUpdatedAt
    ) {
      // 记录后处理日志
      await this.ppLogService.create({
        operatorId: operator.id,
        startTime: operator.statusUpdatedAt,
        endTime: statusUpdatedAt,
      });
    }

    this.events.emit('operator.statusChanged', {
      operatorId,
      status,
    } satisfies OperatorStatusChangedEvent);
  }

  async getRandomReadyOperator() {
    let readyOperators = await this.operatorService.getReadyOperators();

    readyOperators = readyOperators.filter(
      (operator) =>
        operator.workload !== undefined &&
        operator.workload < operator.concurrency,
    );

    if (readyOperators.length === 0) {
      return;
    }

    return _.sample(readyOperators);
  }

  async assignConversation(
    conversation: Conversation | string,
    operator: Operator | string,
    by: UserInfo,
  ) {
    if (typeof conversation === 'string') {
      const conv = await this.conversationService.getConversation(conversation);
      if (!conv || conv.closedAt) return;
      conversation = conv;
    }

    if (typeof operator === 'string') {
      const op = await this.operatorService.getOperator(operator);
      if (!op) return;
      operator = op;
    }

    if (conversation.operatorId?.equals(operator.id)) {
      return;
    }

    const fromOperatorId = conversation.operatorId;

    await this.conversationService.updateConversation(conversation.id, {
      operatorId: operator.id,
    });
    await this.messageService.createMessage(conversation, {
      type: MessageType.Assign,
      from: by,
      data: {
        fromOperatorId,
        toOperatorId: operator._id,
      },
    });

    if (fromOperatorId) {
      await this.operatorService.increaseOperatorWorkload(
        fromOperatorId.toString(),
        -1,
      );
    }
    await this.operatorService.increaseOperatorWorkload(operator.id, 1);

    await this.redis.zrem('conversation_queue', conversation.id);

    await this.createOperatorWelcomeMessage(conversation, operator);

    if (fromOperatorId) {
      // 为原客服重新分配会话
      await this.assignQueuedConversationToOperator(fromOperatorId.toString());
    }
  }

  getQueueLength() {
    return this.redis.zcard('conversation_queue');
  }

  async getQueuePosition(key: string) {
    const rank = await this.redis.zrank('conversation_queue', key);
    if (rank === null) {
      return 0;
    }
    return rank + 1;
  }

  @OnEvent('conversation.created', { async: true })
  async addAutoAssignJob({ conversation }: ConversationCreatedEvent) {
    const queueSize = await this.getQueueLength();
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

    const queueConfig = await this.configService.get('queue');
    if (queueConfig && queueConfig.queuedMessage.enabled) {
      const queuePosition = await this.getQueuePosition(conversationId);
      const template = Handlebars.compile(queueConfig.queuedMessage.text);
      await this.createMessage({
        conversationId,
        from: {
          type: UserType.System,
        },
        data: {
          text: template({
            queue: {
              position: queuePosition,
            },
          }),
        },
      });
    }
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

    if (operator.workload === undefined || operator.workload < 0) {
      return;
    }

    if (operator.status === OperatorStatus.Busy && operator.workload === 0) {
      // 后处理阶段结束, 将客服状态改为 Leave
      await this.setOperatorStatus(operatorId, OperatorStatus.Leave);
      return;
    }

    if (operator.status !== OperatorStatus.Ready) {
      return;
    }

    const maxCount = operator.concurrency - operator.workload;
    if (maxCount > 0) {
      await this.assignQueuedQueue.add({ operatorId, maxCount });
    }
  }
}
