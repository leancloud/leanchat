import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

import { REDIS } from 'src/redis';
import { VisitorService } from 'src/visitor';

@Injectable()
export class ChatService {
  @Inject(REDIS)
  private redis: Redis;

  constructor(private visitorService: VisitorService) {}

  async getOperatorStatus(operatorId: string) {
    const status = await this.redis.hget('operator_status', operatorId);
    return status || 'offline';
  }

  async setOperatorStatus(operatorId: string, status: string) {
    await this.redis.hset('operator_status', operatorId, status);
  }

  async setOperatorReady(operatorId: string) {
    const count = await this.visitorService.getVisitorCountForOperator(
      operatorId,
    );
    await this.redis
      .pipeline()
      .hset('operator_status', operatorId, 'ready')
      .hset('operator_concurrency', operatorId, count)
      .exec();
  }
}
