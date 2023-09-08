import { Inject } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Redis } from 'ioredis';
import _ from 'lodash';

import { REDIS } from 'src/redis';
import { OperatorService } from 'src/operator';
import { ConversationService } from 'src/conversation';
import { AssignConversationJobData } from '../interfaces/assign-job';
import { ChatConversationService } from '../services/chat-conversation.service';

@Processor('assign_conversation')
export class AssignConversationProcessor {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
    private conversationService: ConversationService,
    private operatorService: OperatorService,
    private chatConvService: ChatConversationService,
  ) {}

  @Process()
  async assign(job: Job<AssignConversationJobData>) {
    const { conversationId } = job.data;
    const conv = await this.conversationService.getConversation(conversationId);
    if (!conv) {
      return;
    }

    const operator = await this.selectOperator();
    if (operator) {
      await this.chatConvService.assign(conv, operator);
    } else {
      await this.chatConvService.enqueue(conv);
    }
  }

  async selectOperator() {
    const operatorStatus = await this.redis.hgetall('operator_status');
    const readyOperatorIds = Object.entries(operatorStatus)
      .filter(([, status]) => status === 'ready')
      .map(([id]) => id);
    if (readyOperatorIds.length === 0) {
      return;
    }

    const readyOperators = await this.operatorService.getOperators({
      ids: readyOperatorIds,
    });
    if (readyOperators.length === 0) {
      return;
    }

    const operatorIds = readyOperators.map((o) => o.id);
    const operatorConcurrency = await this.redis.hmget(
      'operator_concurrency',
      ...operatorIds,
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
