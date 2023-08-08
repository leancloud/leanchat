import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { Redis } from 'ioredis';

import { REDIS } from 'src/redis';
import { Visitor } from 'src/visitor';
import { AssignVisitorJobData } from './interfaces/assign-job';

@Injectable()
export class AssignService {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
    @InjectQueue('assign_visitor')
    private assignVisitorQueue: Queue,
  ) {}

  async assignVisitor(visitor: Visitor) {
    const now = new Date();
    const added = await this.redis.zadd(
      'visitor_queue',
      'NX',
      now.getTime(),
      visitor.id,
    );
    if (added) {
      await this.assignVisitorQueue.addBulk([
        {
          name: 'assign',
          data: {
            visitorId: visitor.id,
          } satisfies AssignVisitorJobData,
        },
        {
          name: 'check',
          data: {
            visitorId: visitor.id,
          } satisfies AssignVisitorJobData,
          opts: {
            delay: 1000 * 2, // 2 sec
          },
        },
      ]);
      return now;
    }
  }
}
