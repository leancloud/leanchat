import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import _ from 'lodash';

import { Message, MessageService } from 'src/message';
import { CONVERSATION_STATS_QUEUE } from './constants';
import { ConversationService } from './conversation.service';
import { ConversationStatsJobData } from './interfaces';
import { ConversationStatsService } from './conversation-stats.service';

interface TimeScale {
  type: 'operatorJoin' | 'visitor' | 'operator';
  date: Date;
}

@Processor(CONVERSATION_STATS_QUEUE)
export class ConversationStatsProcessor {
  constructor(
    private conversationService: ConversationService,
    private conversationStatsService: ConversationStatsService,
    private messageService: MessageService,
  ) {}

  @Process()
  async processConversationStats(job: Job<ConversationStatsJobData>) {
    const { conversationId, closedAt } = job.data;

    const conversation = await this.conversationService.getConversation(
      conversationId,
    );
    if (!conversation) {
      return;
    }

    const conversationStats =
      await this.conversationStatsService.getConversationStatsForConversation(
        conversation.id,
      );
    if (!conversationStats) {
      return;
    }

    conversationStats.closedAt = new Date(closedAt);

    let messages = await this.messageService.getMessages({
      conversationId,
      type: 'message',
      limit: 500,
    });

    // TODO filter by database
    messages = messages.filter((message) =>
      ['visitor', 'operator'].includes(message.from.type),
    );

    const messageCount = _.countBy(messages, (message) => message.from.type);
    conversationStats.visitorMessageCount = messageCount.visitor || 0;
    conversationStats.operatorMessageCount = messageCount.operator || 0;

    if (conversationStats.operatorJoinedAt) {
      const reactionTimeList = this.getReactionTimeList(
        messages,
        conversationStats.operatorJoinedAt,
      );
      if (reactionTimeList.length) {
        conversationStats.firstResponseTime = reactionTimeList[0];
      }
      conversationStats.totalResponseTime = _.sum(reactionTimeList);
      conversationStats.totalResponseCount = reactionTimeList.length;
    }

    if (messages.length) {
      conversationStats.receptionTime =
        _.last(messages)!.createdAt.getTime() - messages[0].createdAt.getTime();
    }

    const firstOperatorMessage = messages.find(
      (message) => message.from.type === 'operator',
    );
    if (firstOperatorMessage) {
      conversationStats.firstOperatorMessageAt = firstOperatorMessage.createdAt;
    }

    await conversationStats.save();
  }

  getReactionTimeList(messages: Message[], operatorJoinedAt: Date) {
    const list: number[] = [];
    let scale: TimeScale = {
      type: 'operatorJoin',
      date: operatorJoinedAt,
    };
    messages.forEach((message) => {
      switch (message.from.type) {
        case 'visitor':
          if (scale.type !== 'visitor') {
            scale = {
              type: 'visitor',
              date: message.createdAt,
            };
          }
          break;
        case 'operator':
          if (scale.type !== 'operator') {
            list.push(message.createdAt.getTime() - scale.date.getTime());
            scale = {
              type: 'operator',
              date: message.createdAt,
            };
          }
      }
    });
    return list;
  }
}
