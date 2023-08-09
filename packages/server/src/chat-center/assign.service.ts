import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { Redis } from 'ioredis';

import { REDIS } from 'src/redis';
import { Conversation } from 'src/conversation';
import { AssignConversationJobData } from './interfaces/assign-job';

@Injectable()
export class AssignService {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
    @InjectQueue('assign_conversation')
    private assignVisitorQueue: Queue,
  ) {}

  async assignConversation(conv: Conversation) {
    const now = new Date();
    const added = await this.redis.zadd(
      'conversation_queue',
      'NX',
      now.getTime(),
      conv.id,
    );
    if (added) {
      await this.assignVisitorQueue.addBulk([
        {
          name: 'assign',
          data: {
            id: conv.id,
          } satisfies AssignConversationJobData,
        },
        {
          name: 'check',
          data: {
            id: conv.id,
          } satisfies AssignConversationJobData,
          opts: {
            delay: 1000 * 2, // 2 sec
          },
        },
      ]);
      return now;
    }
  }
}
