import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron } from '@nestjs/schedule';
import { Redis } from 'ioredis';
import _ from 'lodash';

import { ConversationCreatedEvent } from 'src/event';
import { REDIS } from 'src/redis';
import { ConversationService } from 'src/conversation';
import { QUEUE_CHAT_BOT_DISPATCH, QUEUE_CHAT_BOT_PROCESS } from './constants';
import { ChatBotDispatchJobData, ChatBotProcessJobData } from './interfaces';
import { ChatBotService } from './chat-bot.service';

@Injectable()
export class EventHandler {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
    @InjectQueue(QUEUE_CHAT_BOT_DISPATCH)
    private chatBotDispatchQueue: Queue<ChatBotDispatchJobData>,
    @InjectQueue(QUEUE_CHAT_BOT_PROCESS)
    private chatBotProcessQueue: Queue<ChatBotProcessJobData>,
    private conversationService: ConversationService,
    private chatBotService: ChatBotService,
  ) {}

  @OnEvent('conversation.created', { async: true })
  handleOnConversationCreated(payload: ConversationCreatedEvent) {
    this.chatBotDispatchQueue.add({
      type: 'onConversationCreated',
      context: {
        conversationId: payload.conversation.id,
      },
    });
  }

  @Cron('0 */5 * * * *')
  async handleVisitorInactive() {
    const acquired = await this.acquireIntervalEventLock();
    if (!acquired) {
      return;
    }

    const chatBots = await this.chatBotService.getChatBotsByNodeType(
      'onVisitorInactive',
    );
    if (chatBots.length === 0) {
      return;
    }

    const convs = await this.conversationService.getConversations({
      status: 'inProgress',
      limit: 1000,
    });
    if (convs.length === 0) {
      return;
    }

    const jobDatas: ChatBotProcessJobData[] = [];

    convs.forEach((conv) => {
      chatBots.forEach((chatBot) => {
        chatBot.nodes
          .filter((node) => {
            if (node.type === 'onVisitorInactive') {
              const visitorLastActivityAt =
                conv.visitorLastActivityAt || conv.createdAt;
              const time =
                visitorLastActivityAt.getTime() + node.inactiveDuration * 1000;
              return Date.now() >= time;
            }
            return false;
          })
          .forEach((node) => {
            jobDatas.push({
              chatBotId: chatBot.id,
              nodes: chatBot.nodes,
              edges: chatBot.edges,
              nodeId: node.id,
              context: {
                conversationId: conv.id,
              },
            });
          });
      });
    });

    const jobDataChunks = _.chunk(jobDatas, 20);
    for (const jobDatas of jobDataChunks) {
      await this.chatBotProcessQueue.addBulk(
        jobDatas.map((data) => ({ data })),
      );
    }
  }

  private async acquireIntervalEventLock(timeout = 60) {
    const res = await this.redis.set(
      'chat_bot_interval_lock',
      1,
      'EX',
      timeout,
      'NX',
    );
    return res === 'OK';
  }
}
