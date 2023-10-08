import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { differenceInMilliseconds, isBefore } from 'date-fns';
import _ from 'lodash';
import { Types } from 'mongoose';

import { ConversationStatsJobData } from '../interfaces';
import { ConversationService, MessageService } from '../services';
import { Conversation, Message } from '../models';

@Processor('conversation_stats')
export class ConversationStatsProcessor {
  constructor(
    private conversationService: ConversationService,
    private messageService: MessageService,
  ) {}

  @Process()
  async process(job: Job<ConversationStatsJobData>) {
    const conversation = await this.conversationService.getConversation(
      job.data.conversationId,
    );
    if (!conversation || !conversation.closedAt) {
      return;
    }

    const messages = await this.messageService.getMessages({
      conversationId: conversation.id,
      limit: 500,
    });

    const chatMessages = messages.filter(
      (m) =>
        m.type === 'message' &&
        (m.from.type === 'visitor' || m.from.type === 'operator'),
    );

    const stats: Conversation['stats'] = {};

    const messageCount = _.countBy(chatMessages, (m) => m.from.type);
    stats.visitorMessageCount = messageCount.visitor || 0;
    stats.operatorMessageCount = messageCount.operator || 0;

    const firstOperatorJoinMessage = messages.find((m) => m.type === 'join');
    if (firstOperatorJoinMessage) {
      stats.firstOperatorJoinedAt = firstOperatorJoinMessage.createdAt;
      const responseTimeList = this.getResponseTimeList(
        chatMessages,
        firstOperatorJoinMessage.createdAt,
      );
      if (responseTimeList.length) {
        stats.firstResponseTime = responseTimeList[0];
        stats.responseTime = _.sum(responseTimeList);
        stats.responseCount = responseTimeList.length;
        stats.averageResponseTime = stats.responseTime / stats.responseCount;
      }
    }

    if (messageCount.visitor && messageCount.operator) {
      stats.receptionTime = this.getReceptionTime(chatMessages);
    }

    const firstOperatorMessage = chatMessages.find(
      (m) => m.from.type === 'operator',
    );
    if (firstOperatorMessage) {
      stats.firstOperatorMessageCreatedAt = firstOperatorMessage.createdAt;
    }

    if (conversation.queuedAt) {
      if (
        firstOperatorJoinMessage &&
        isBefore(firstOperatorJoinMessage.createdAt, conversation.closedAt)
      ) {
        stats.queueConnectionTime = differenceInMilliseconds(
          firstOperatorJoinMessage.createdAt,
          conversation.queuedAt,
        );
      } else {
        stats.queueTimeToLeave = differenceInMilliseconds(
          conversation.closedAt,
          conversation.queuedAt,
        );
      }
    }

    const joinedOperatorIds = messages
      .filter((message) => message.type === 'join')
      .slice(0, 10)
      .map((message) => message.from.id);
    if (joinedOperatorIds.length) {
      stats.joinedOperatorIds = joinedOperatorIds.map(
        (id) => new Types.ObjectId(id),
      );
    }

    await this.conversationService.updateConversation(conversation.id, {
      stats,
    });
  }

  private getResponseTimeList(
    chatMessages: Message[],
    firstOperatorJoinedAt: Date,
  ) {
    const list: number[] = [];

    let actType = 'start';
    let actTime = firstOperatorJoinedAt;
    for (const message of chatMessages) {
      if (actType === message.from.type) {
        continue;
      }
      if (message.from.type === 'operator') {
        list.push(differenceInMilliseconds(message.createdAt, actTime));
      }
      actType = message.from.type;
      actTime = message.createdAt;
    }

    return list;
  }

  private getReceptionTime(chatMessages: Message[]) {
    if (chatMessages.length < 1) {
      return;
    }
    return differenceInMilliseconds(
      chatMessages[chatMessages.length - 1].createdAt,
      chatMessages[0].createdAt,
    );
  }
}
