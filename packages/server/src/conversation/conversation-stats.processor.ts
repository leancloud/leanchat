import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import _ from 'lodash';

import { Message, MessageService } from 'src/message';
import { CONVERSATION_STATS_QUEUE } from './constants';
import { ConversationService } from './conversation.service';
import { ConversationStatsJobData } from './interfaces';

interface TimeScale {
  type: 'operatorJoin' | 'visitor' | 'operator';
  date: Date;
}

@Processor(CONVERSATION_STATS_QUEUE)
export class ConversationStatsProcessor {
  constructor(
    private conversationService: ConversationService,
    private messageService: MessageService,
  ) {}

  @Process()
  async processConversationStats(job: Job<ConversationStatsJobData>) {
    const { conversationId } = job.data;

    const conversation = await this.conversationService.getConversation(
      conversationId,
    );
    if (!conversation) {
      return;
    }

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
    conversation.stats.visitorMessageCount = messageCount.visitor || 0;
    conversation.stats.operatorMessageCount = messageCount.operator || 0;

    if (conversation.timestamps.operatorJoinedAt) {
      const reactionTimeList = this.getReactionTimeList(
        messages,
        conversation.timestamps.operatorJoinedAt,
      );
      if (reactionTimeList.length) {
        conversation.stats.firstResponseTime = reactionTimeList[0];
      }
      conversation.stats.responseTime = _.sum(reactionTimeList);
      conversation.stats.responseCount = reactionTimeList.length;
    }

    if (messageCount.visitor && messageCount.operator) {
      conversation.stats.receptionTime =
        _.last(messages)!.createdAt.getTime() - messages[0].createdAt.getTime();
    }

    const firstOperatorMessage = messages.find(
      (message) => message.from.type === 'operator',
    );
    if (firstOperatorMessage) {
      conversation.timestamps.operatorFirstMessageAt =
        firstOperatorMessage.createdAt;
    }

    await conversation.save();
  }

  getReactionTimeList(messages: Message[], operatorJoinedAt: Date) {
    const list: number[] = [];
    let scale: TimeScale = {
      type: 'operatorJoin',
      date: operatorJoinedAt,
    };
    const indexAfterOperatorJoined = messages.findIndex(
      (message) => message.createdAt.getTime() > operatorJoinedAt.getTime(),
    );
    if (indexAfterOperatorJoined !== -1) {
      messages = messages.slice(indexAfterOperatorJoined);
    }
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
