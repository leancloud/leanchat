import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { subSeconds } from 'date-fns';

import { ChatService, ConversationService, UserType } from 'src/chat';
import { ConfigService } from 'src/config';
import { InjectRedis, Redis } from 'src/redis';

@Injectable()
export class AutoCloseConversationService {
  @InjectRedis()
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
      if (config.message.enabled) {
        await this.chatService.createMessage({
          conversationId,
          from: {
            type: UserType.System,
          },
          data: {
            text: config.message.text,
          },
        });
      }

      await this.chatService.closeConversation({
        conversationId,
        by: {
          type: UserType.System,
        },
      });
    }
  }
}
