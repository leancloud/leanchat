import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

import { REDIS } from 'src/redis';
import { Visitor, VisitorService } from 'src/visitor';
import { Operator, OperatorService } from 'src/operator';

@Injectable()
export class ConversationService {
  constructor(
    @Inject(REDIS)
    private redis: Redis,

    private visitorService: VisitorService,

    private operatorService: OperatorService,
  ) {}

  getOperatorStatus(operatorId: string) {
    return this.redis.hget('operator_status', operatorId);
  }

  async assignOperator(visitor: Visitor, operator: Operator) {
    const operatorStatus = await this.getOperatorStatus(operator.id);
    if (operatorStatus !== 'ready') {
      throw new BadRequestException(`客服 ${operator.id} 不是在线状态`);
    }

    await this.visitorService.updateVisitor(visitor, {
      status: 'in_progress',
      operatorId: operator.id,
    });

    await this.redis
      .pipeline()
      .zrem('visitor_queue', visitor.id)
      .hincrby('operator_concurrency', operator.id, 1)
      .exec();
  }

  async closeConversation(visitor: Visitor) {
    const operatorId = visitor.operatorId;

    await this.visitorService.updateVisitor(visitor, {
      status: 'solved',
      operatorId: null,
    });

    if (operatorId) {
      await this.redis.hincrby('operator_concurrency', operatorId, -1);
    }
  }
}
