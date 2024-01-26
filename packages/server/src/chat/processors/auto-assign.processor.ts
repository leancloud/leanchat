import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import Handlebars from 'handlebars';
import _ from 'lodash';

import { ConfigService } from 'src/config';
import { AutoAssignJobData } from '../interfaces';
import {
  ChatService,
  ChatbotService,
  ConversationService,
  OperatorService,
} from '../services';
import { ChatbotAcceptRule, UserType } from '../constants';
import { Operator } from '../models';

@Processor('auto_assign_conversation')
export class AutoAssignProcessor {
  constructor(
    private chatService: ChatService,
    private chatbotService: ChatbotService,
    private conversationService: ConversationService,
    private configService: ConfigService,
    private operatorService: OperatorService,
  ) {}

  @Process()
  async assign(job: Job<AutoAssignJobData>) {
    const { conversationId, chatbot: assignToBot } = job.data;

    const conversation = await this.conversationService.getConversation(
      conversationId,
    );
    if (!conversation || conversation.operatorId) {
      return;
    }

    if (assignToBot && !conversation.chatbotId) {
      const chatbot = await this.chatbotService.assignChatbotToConversation(
        conversationId,
        ChatbotAcceptRule.New,
      );
      if (chatbot) {
        return;
      }
    }

    const readyOperators = await this.operatorService.getReadyOperators();
    if (readyOperators.length === 0) {
      const noReadyMsg = await this.configService.get('noReadyOperatorMessage');
      if (noReadyMsg) {
        await this.chatService.createMessage({
          conversationId,
          from: {
            type: UserType.System,
          },
          data: {
            text: noReadyMsg.text,
          },
        });
      }
      await this.chatService.closeConversation({
        conversationId,
        by: {
          type: UserType.System,
        },
      });
      return;
    }

    const operator = this.getAvailableOperator(readyOperators);
    if (operator) {
      await this.chatService.assignConversation(conversationId, operator, {
        type: UserType.System,
      });
      return;
    }

    const enqueued = await this.chatService.enqueueConversation(conversationId);
    if (!enqueued) {
      // already in queue
      return;
    }

    const queueConfig = await this.configService.get('queue');
    if (queueConfig) {
      const queuePosition = await this.chatService.getQueuePosition(
        conversationId,
      );
      const template = Handlebars.compile(queueConfig.queuedMessage.text);
      const text = template({
        queue: {
          position: queuePosition,
        },
      });
      await this.chatService.createMessage({
        conversationId,
        from: {
          type: UserType.System,
        },
        data: { text },
      });
    }

    await this.chatbotService.assignChatbotToConversation(
      conversationId,
      ChatbotAcceptRule.Queued,
    );
  }

  private getAvailableOperator(operators: Operator[]) {
    const availableOperators = operators.filter(
      (operator) =>
        operator.workload !== undefined &&
        operator.workload < operator.concurrency,
    );
    return _.minBy(_.shuffle(availableOperators), (o) => o.workload);
  }
}
