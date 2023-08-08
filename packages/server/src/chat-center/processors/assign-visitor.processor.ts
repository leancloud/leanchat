import { Inject } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Redis } from 'ioredis';
import EventEmitter2 from 'eventemitter2';
import _ from 'lodash';

import { REDIS } from 'src/redis';
import { VisitorService } from 'src/visitor';
import { OperatorService } from 'src/operator';
import { ConversationService } from '../conversation.service';
import { AssignVisitorJobData } from '../interfaces/assign-job';
import { ConversationQueuedEvent } from '../events';

@Processor('assign_visitor')
export class AssignVisitorProcessor {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
    private events: EventEmitter2,
    private visitorService: VisitorService,
    private operatorService: OperatorService,
    private conversationService: ConversationService,
  ) {}

  @Process('assign')
  async assign(job: Job<AssignVisitorJobData>) {
    const visitor = await this.visitorService.getVisitor(job.data.visitorId);
    if (!visitor) {
      return;
    }

    const operator = await this.selectOperator();
    if (!operator) {
      return;
    }

    await this.conversationService.assignOperator(visitor, operator);
  }

  @Process('check')
  async check(job: Job<AssignVisitorJobData>) {
    const { visitorId } = job.data;
    const queued = await this.conversationService.conversationQueued(visitorId);
    if (queued) {
      this.events.emit('conversation.queued', {
        visitorId,
      } satisfies ConversationQueuedEvent);
    }
  }

  async selectOperator() {
    const { operators } = await this.operatorService.listOperators({
      pageSize: 1000,
    });
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
