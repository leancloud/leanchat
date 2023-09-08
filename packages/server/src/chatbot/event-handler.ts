import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron } from '@nestjs/schedule';
import { Redis } from 'ioredis';
import _ from 'lodash';

import { ConversationCreatedEvent } from 'src/event';
import { REDIS } from 'src/redis';
import { ConversationService, ConversationStatus } from 'src/conversation';
import { QUEUE_CHATBOT_DISPATCH, QUEUE_CHATBOT_PROCESS } from './constants';
import { ChatbotDispatchJobData, ChatbotProcessJobData } from './interfaces';
import { ChatbotService } from './chatbot.service';

@Injectable()
export class EventHandler {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
    @InjectQueue(QUEUE_CHATBOT_DISPATCH)
    private chatbotDispatchQueue: Queue<ChatbotDispatchJobData>,
    @InjectQueue(QUEUE_CHATBOT_PROCESS)
    private chatbotProcessQueue: Queue<ChatbotProcessJobData>,
    private conversationService: ConversationService,
    private chatbotService: ChatbotService,
  ) {}

  @OnEvent('conversation.created', { async: true })
  handleOnConversationCreated(payload: ConversationCreatedEvent) {
    this.chatbotDispatchQueue.add({
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

    const chatbots = await this.chatbotService.getChatbotsByNodeType(
      'onVisitorInactive',
    );
    if (chatbots.length === 0) {
      return;
    }

    const convs = await this.conversationService.getConversations({
      status: ConversationStatus.InProgress,
      limit: 1000,
    });
    if (convs.length === 0) {
      return;
    }

    const jobDatas: ChatbotProcessJobData[] = [];

    convs.forEach((conv) => {
      chatbots.forEach((chatbot) => {
        chatbot.nodes
          .filter((node) => {
            if (node.type === 'onVisitorInactive') {
              const visitorLastActivityAt =
                conv.timestamps.visitorLastMessageAt || conv.createdAt;
              if (
                !conv.timestamps.operatorLastMessageAt ||
                conv.timestamps.operatorLastMessageAt.getTime() <
                  visitorLastActivityAt.getTime()
              ) {
                return false;
              }
              const time =
                visitorLastActivityAt.getTime() + node.inactiveDuration * 1000;
              return Date.now() >= time;
            }
            return false;
          })
          .forEach((node) => {
            jobDatas.push({
              chatbotId: chatbot.id,
              nodes: chatbot.nodes,
              edges: chatbot.edges,
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
      await this.chatbotProcessQueue.addBulk(
        jobDatas.map((data) => ({ data })),
      );
    }
  }

  private async acquireIntervalEventLock(timeout = 60) {
    const res = await this.redis.set(
      'chatbot_interval_lock',
      1,
      'EX',
      timeout,
      'NX',
    );
    return res === 'OK';
  }
}
