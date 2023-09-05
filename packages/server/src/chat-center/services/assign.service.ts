import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { Redis } from 'ioredis';

import { REDIS } from 'src/redis';
import { ConversationDocument } from 'src/conversation';
import { AssignConversationJobData } from '../interfaces/assign-job';

@Injectable()
export class AssignService {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
    @InjectQueue('assign_conversation')
    private assignVisitorQueue: Queue<AssignConversationJobData>,
  ) {}

  async assignConversation(conv: ConversationDocument) {
    const queuedAt = new Date();
    const added = await this.redis.zadd(
      'conversation_queue',
      'NX',
      queuedAt.getTime(),
      conv.id,
    );
    if (added) {
      await this.assignVisitorQueue.add({
        conversationId: conv.id,
      });
    }
  }
}
