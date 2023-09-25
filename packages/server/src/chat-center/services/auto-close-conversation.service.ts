import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Redis } from 'ioredis';
import { subSeconds } from 'date-fns';

import { ChatService, ConversationService } from 'src/chat';
import { ConfigService } from 'src/config';
import { REDIS } from 'src/redis';

@Injectable()
export class AutoCloseConversationService {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
    private chatService: ChatService,
    private conversationService: ConversationService,
    private configService: ConfigService,
  ) {}

  private async acquireLock(timeout: number) {
    const res = await this.redis.set(
      'lock:auto_close_conversation',
      1,
      'EX',
      timeout,
      'NX',
    );
    return res === 'OK';
  }

  @Cron('0 * * * * *')
  async autoClose() {
    const lock = await this.acquireLock(20);
    if (!lock) {
      return;
    }

    const config = await this.configService.get('autoClose');
    if (!config || config.timeout <= 0) {
      return;
    }

    const conversationIds =
      await this.conversationService.getInactiveConversationIds({
        lastActivityBefore: subSeconds(new Date(), config.timeout),
        limit: 100,
      });

    for (const conversationId of conversationIds) {
      await this.chatService.closeConversation({
        conversationId,
        by: {
          type: 'system',
        },
        reason: 'visitorNoResponse',
      });
    }
  }
}
