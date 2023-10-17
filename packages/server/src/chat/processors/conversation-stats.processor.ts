import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { differenceInMilliseconds, isAfter, isBefore } from 'date-fns';
import _ from 'lodash';

import { ConversationStatsJobData } from '../interfaces';
import { ConversationService, MessageService } from '../services';
import { Conversation, Message } from '../models';
import { ConsultationResult, MessageType, UserType } from '../constants';

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
        m.type === MessageType.Message &&
        (m.from.type === UserType.Visitor || m.from.type === UserType.Operator),
    );

    const stats: Conversation['stats'] = {};

    const messageCount = _.countBy(chatMessages, (m) => m.from.type);
    stats.visitorMessageCount = messageCount[UserType.Visitor] || 0;
    stats.operatorMessageCount = messageCount[UserType.Operator] || 0;

    const firstAssignMessage = messages.find(
      (m) => m.type === MessageType.Assign,
    );
    if (firstAssignMessage) {
      stats.firstOperatorJoinedAt = firstAssignMessage.createdAt;
      const responseTimeList = this.getResponseTimeList(
        chatMessages,
        firstAssignMessage.createdAt,
      );
      if (responseTimeList.length) {
        stats.firstResponseTime = responseTimeList[0];
        stats.maxResponseTime = _.max(responseTimeList);
        stats.responseTime = _.sum(responseTimeList);
        stats.responseCount = responseTimeList.length;
        stats.averageResponseTime = stats.responseTime / stats.responseCount;
      }

      const communicateMessages = chatMessages.filter((message) =>
        isAfter(message.createdAt, firstAssignMessage.createdAt),
      );

      const hasVisitorMessage = communicateMessages.some(
        (message) => message.from.type === UserType.Visitor,
      );
      const hasOperatorMessage = communicateMessages.some(
        (message) => message.from.type === UserType.Operator,
      );
      if (hasOperatorMessage) {
        if (hasVisitorMessage) {
          stats.consultationResult = ConsultationResult.Valid;
        } else {
          stats.consultationResult = ConsultationResult.Invalid;
        }
      } else {
        stats.consultationResult = ConsultationResult.OperatorNoResponse;
      }

      if (communicateMessages.length > 1) {
        stats.receptionTime = differenceInMilliseconds(
          communicateMessages[communicateMessages.length - 1].createdAt,
          communicateMessages[0].createdAt,
        );
      }
    }

    stats.operatorFirstMessageCreatedAt = chatMessages.find(
      (m) => m.from.type === UserType.Operator,
    )?.createdAt;
    stats.operatorLastMessageCreatedAt = _.findLast(
      chatMessages,
      (m) => m.from.type === UserType.Operator,
    )?.createdAt;
    stats.visitorFirstMessageCreatedAt = chatMessages.find(
      (m) => m.from.type === UserType.Visitor,
    )?.createdAt;
    stats.visitorLastMessageCreatedAt = _.findLast(
      chatMessages,
      (m) => m.from.type === UserType.Visitor,
    )?.createdAt;

    if (conversation.queuedAt) {
      if (
        firstAssignMessage &&
        isBefore(firstAssignMessage.createdAt, conversation.closedAt)
      ) {
        stats.queueConnectionTime = differenceInMilliseconds(
          firstAssignMessage.createdAt,
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
      .filter((message) => message.type === MessageType.Assign)
      .slice(0, 10)
      .map((message) => message.data.toOperatorId);
    if (joinedOperatorIds.length) {
      stats.joinedOperatorIds = joinedOperatorIds;
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

    let actType = -1;
    let actTime = firstOperatorJoinedAt;
    for (const message of chatMessages) {
      if (actType === message.from.type) {
        continue;
      }
      if (message.from.type === UserType.Operator) {
        list.push(differenceInMilliseconds(message.createdAt, actTime));
      }
      actType = message.from.type;
      actTime = message.createdAt;
    }

    return list;
  }
}
