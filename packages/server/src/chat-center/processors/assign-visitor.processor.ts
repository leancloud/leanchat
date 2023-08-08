import { Inject, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Redis } from 'ioredis';
import _ from 'lodash';

import { IAssignVisitorJobData } from 'src/common/interfaces';
import { REDIS } from 'src/redis';
import { VisitorService } from 'src/visitor';
import { OperatorService } from 'src/operator';
import { ConversationService } from '../conversation.service';

@Processor('assign_visitor')
export class AssignVisitorProcessor {
  @Inject(REDIS)
  private redis: Redis;

  private readonly logger = new Logger(AssignVisitorProcessor.name);

  constructor(
    private visitorService: VisitorService,
    private operatorService: OperatorService,
    private conversationService: ConversationService,
  ) {}

  @Process()
  async assign(job: Job<IAssignVisitorJobData>) {
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
