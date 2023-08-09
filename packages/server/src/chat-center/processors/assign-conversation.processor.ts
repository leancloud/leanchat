import { Inject } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Redis } from 'ioredis';
import EventEmitter2 from 'eventemitter2';
import _ from 'lodash';

import { REDIS } from 'src/redis';
import { OperatorService } from 'src/operator';
import { ConversationService } from 'src/conversation';
import { AssignConversationJobData } from '../interfaces/assign-job';
import { ConversationQueuedEvent } from '../events';
import { ChatConversationService } from '../services/chat-conversation.service';

@Processor('assign_conversation')
export class AssignConversationProcessor {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
    private events: EventEmitter2,
    private conversationService: ConversationService,
    private operatorService: OperatorService,
    private chatConvService: ChatConversationService,
  ) {}

  @Process('assign')
  async assign(job: Job<AssignConversationJobData>) {
    const conv = await this.conversationService.getConversation(job.data.id);
    if (!conv) {
      return;
    }

    const operator = await this.selectOperator();
    if (!operator) {
      return;
    }

    await this.chatConvService.assign(conv, operator);
  }

  @Process('check')
  async check(job: Job<AssignConversationJobData>) {
    const { id } = job.data;
    const score = await this.redis.zscore('conversation_queue', id);
    if (score === null) {
      return;
    }
    this.events.emit('conversation.queued', {
      conversationId: id,
    } satisfies ConversationQueuedEvent);
  }

  async selectOperator() {
    const operators = await this.operatorService.getOperators();
    if (operators.length === 0) {
      return;
    }
    const operatorStatus = await this.redis.hgetall('operator_status');
    const readyOperators = operators.filter(
      (o) => operatorStatus[o.id] === 'ready',
    );
    if (readyOperators.length === 0) {
      return;
    }
    const readyOperatorIds = readyOperators.map((o) => o.id);
    const operatorConcurrency = await this.redis.hmget(
      'operator_concurrency',
      ...readyOperatorIds,
    );
    const entries = _.zip(readyOperators, operatorConcurrency);
    for (const [operator, concurrency] of entries) {
      if (!operator || !concurrency) {
        continue;
      }
      if (operator.concurrency > parseInt(concurrency)) {
        return operator;
      }
    }
  }
}
