import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { addSeconds, isAfter } from 'date-fns';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { InjectRedis, Redis } from 'src/redis';
import { ConfigService } from 'src/config';
import {
  CloseConversationOptions,
  ConversationEvaluation,
  ConversationStatsJobData,
  ReopenConversationOptions,
  UpdateConversationData,
} from '../interfaces/conversation.interface';
import { CreateMessageData } from '../interfaces/chat.interface';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import {
  AssignQueuedJobData,
  AutoAssignJobData,
  PreviousStatus,
} from '../interfaces';
import {
  ConversationCreatedEvent,
  OperatorStatusChangedEvent,
} from '../events';
import { OperatorService } from './operator.service';
import { Conversation, Operator } from '../models';
import {
  ConversationStatus,
  MessageType,
  OperatorStatus,
  UserType,
} from '../constants';
import { UserInfo } from '../interfaces/common';
import { PostprocessingLogService } from './postprocessing-log.service';
import { VisitorService } from './visitor.service';

@Injectable()
export class ChatService {
  @InjectRedis()
  private redis: Redis;

  @InjectModel(Operator)
  private operatorModel: ReturnModelType<typeof Operator>;

  constructor(
    private events: EventEmitter2,
    private conversationService: ConversationService,
    private messageService: MessageService,
    private operatorService: OperatorService,
    private visitorService: VisitorService,
    private ppLogService: PostprocessingLogService,
    private configService: ConfigService,

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
    if (!conversation || conversation.status === ConversationStatus.Closed) {
      return;
    }

    const message = await this.messageService.createMessage(conversation, {
      from,
      type: MessageType.Message,
      data,
    });

    const convData: UpdateConversationData = {};

    switch (from.type) {
      case UserType.Visitor:
        convData.visitorLastActivityAt = message.createdAt;
        if (!conversation.visitorWaitingSince) {
          convData.visitorWaitingSince = message.createdAt;
        }
        break;
      case UserType.Operator:
      case UserType.Chatbot:
        convData.operatorLastActivityAt = message.createdAt;
        convData.visitorWaitingSince = null;
        break;
    }

    await this.conversationService.updateConversation(
      conversation.id,
      convData,
    );

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
      return;
    }

    if (conversation.closedAt) {
      const evaluationConfig = await this.configService.get('evaluation');
      if (
        evaluationConfig?.timeout &&
        isAfter(
          new Date(),
          addSeconds(conversation.closedAt, evaluationConfig.timeout),
        )
      ) {
        return;
      }
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
    const startGetConversation = performance.now();
    const conversation = await this.conversationService.getConversation(
      conversationId,
    );
    if (!conversation || conversation.status === ConversationStatus.Closed) {
      return;
    }

    const endGetConversation = performance.now();
    console.log(
      'closeConversation - getConversation',
      conversationId,
      new Date(),
      endGetConversation - startGetConversation,
    );

    await this.redis.zrem('conversation_queue', conversation.id);

    await this.conversationService.updateConversation(conversationId, {
      status: ConversationStatus.Closed,
      closedAt: new Date(),
      closedBy: by,
    });

    const endUpdateConversation = performance.now();
    console.log(
      'closeConversation - updateConversation',
      conversationId,
      new Date(),
      endUpdateConversation - endGetConversation,
    );

    await this.messageService.createMessage(conversation, {
      type: MessageType.Close,
      from: by,
    });

    const endCreateMessage = performance.now();
    console.log(
      'closeConversation - createMessage',
      conversationId,
      new Date(),
      endCreateMessage - endUpdateConversation,
    );

    await this.conversationStatsQueue.add({
      conversationId: conversation.id,
    });

    if (conversation.operatorId) {
      const operatorId = conversation.operatorId.toString();
      await this.operatorService.increaseOperatorWorkload(operatorId, -1);
      await this.assignQueuedConversationToOperator(operatorId);
    }

    const endCloseConversation = performance.now();
    console.log(
      'closeConversation - end',
      conversationId,
      new Date(),
      endCloseConversation - endCreateMessage,
    );
  }

  async reopenConversation({ conversationId, by }: ReopenConversationOptions) {
    const conversation = await this.conversationService.getConversation(
      conversationId,
    );
    if (!conversation || conversation.status !== ConversationStatus.Closed) {
      return;
    }

    const visitor = await this.visitorService.getVisitor(
      conversation.visitorId,
    );
    if (!visitor?.currentConversationId?.equals(conversation._id)) {
      throw new BadRequestException('Visitor started a new conversation');
    }

    await this.conversationService.updateConversation(conversationId, {
      status: ConversationStatus.Open,
    });
    await this.messageService.createMessage(conversation, {
      type: MessageType.Reopen,
      from: by,
    });

    if (conversation.operatorId) {
      const operatorId = conversation.operatorId.toString();
      await this.operatorService.increaseOperatorWorkload(operatorId, 1);
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

    const previous: PreviousStatus | undefined = operator.status &&
      operator.statusUpdatedAt && {
        status: operator.status,
        from: operator.statusUpdatedAt,
        to: statusUpdatedAt,
      };

    this.events.emit('operator.statusChanged', {
      operatorId,
      status,
      previous,
    } satisfies OperatorStatusChangedEvent);

    return previous;
  }

  async hasReadyOperator() {
    const operator = await this.operatorModel
      .findOne({ status: OperatorStatus.Ready })
      .select('_id');
    return !!operator;
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

    if (conversation.closedAt) {
      // TODO: move out
      return;
    }

    if (conversation.operatorId?.equals(operator.id)) {
      return;
    }

    const previousOperatorId = conversation.operatorId;

    const now = new Date();
    await this.conversationService.updateConversation(conversation.id, {
      operatorId: operator.id,
      // reset visitorWaitingSince on first assign
      visitorWaitingSince: previousOperatorId ? undefined : now,
      operatorLastActivityAt: now,
    });
    await this.messageService.createMessage(conversation, {
      type: MessageType.Assign,
      from: by,
      data: {
        previousOperatorId,
        operatorId: operator._id,
      },
    });

    if (previousOperatorId) {
      await this.operatorService.increaseOperatorWorkload(
        previousOperatorId.toString(),
        -1,
      );
    }
    await this.operatorService.increaseOperatorWorkload(operator.id, 1);

    await this.redis.zrem('conversation_queue', conversation.id);

    if (previousOperatorId) {
      // 为原客服重新分配会话
      await this.assignQueuedConversationToOperator(
        previousOperatorId.toString(),
      );
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

  async getTheEarliestEnqueueTime() {
    const [, time] = await this.redis.zrange(
      'conversation_queue',
      0,
      0,
      'WITHSCORES',
    );
    if (time) {
      return new Date(parseInt(time));
    }
  }

  @OnEvent('conversation.created', { async: true })
  handleAutoAssign({ conversation }: ConversationCreatedEvent) {
    this.addAutoAssignJob(conversation.id, true);
  }

  async addAutoAssignJob(conversationId: string, chatbot?: boolean) {
    await this.autoAssignQueue.add(
      { conversationId, chatbot },
      { delay: 1000 },
    );
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
      return false;
    }
    await this.conversationService.updateConversation(conversationId, {
      queuedAt,
    });
    return true;
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
