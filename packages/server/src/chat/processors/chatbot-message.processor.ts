import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import Handlebars from 'handlebars';

import { ConfigService } from 'src/config';
import {
  ChatService,
  ChatbotQuestionService,
  ChatbotService,
} from '../services';
import { ChatbotContext, ChatbotMessageJobData } from '../interfaces';
import { ChatbotQuestion } from '../models';
import { UserType } from '../constants';

@Processor('chatbot_message')
export class ChatbotMessageProcessor {
  constructor(
    private chatService: ChatService,
    private chatbotService: ChatbotService,
    private chatbotQuestionService: ChatbotQuestionService,
    private configService: ConfigService,
  ) {}

  @Process()
  async process(job: Job<ChatbotMessageJobData>) {
    const { conversationId, chatbotId, message } = job.data;

    const chatbot = await this.chatbotService.getChatBot(chatbotId);
    if (!chatbot) {
      return;
    }

    const context = await this.chatbotService.getContext(conversationId);

    if (chatbot.globalQuestionBaseIds.length) {
      const question = await this.chatbotQuestionService.matchQuestion(
        chatbot.globalQuestionBaseIds,
        message.text,
      );
      if (question) {
        await this.processQuestion(
          conversationId,
          chatbot.id,
          question,
          context,
          false,
        );
        await this.chatbotService.setContext(conversationId, context);
        return;
      }
    }

    if (!context.questionBaseIds) {
      context.questionBaseIds = chatbot.initialQuestionBaseIds.map((id) =>
        id.toString(),
      );
    }

    if (context.questionBaseIds.length) {
      const question = await this.chatbotQuestionService.matchQuestion(
        context.questionBaseIds,
        message.text,
      );
      if (question) {
        await this.processQuestion(
          conversationId,
          chatbot.id,
          question,
          context,
        );
        await this.chatbotService.setContext(conversationId, context);
        return;
      }
    }

    await this.chatbotService.setContext(conversationId, context);

    // no match
    await this.chatService.createMessage({
      conversationId,
      from: {
        type: UserType.Chatbot,
        id: chatbotId,
      },
      data: {
        text: chatbot.noMatchMessage.text,
      },
    });
  }

  async processQuestion(
    conversationId: string,
    chatbotId: string,
    question: ChatbotQuestion,
    context: ChatbotContext,
    switchBase = true,
  ) {
    const template = Handlebars.compile(question.answer.text);
    const queuePosition = await this.chatService.getQueuePosition(
      conversationId,
    );
    let text = template({
      context,
      queue: {
        position: queuePosition,
      },
    }).trim();

    if (switchBase && question.nextQuestionBaseId) {
      context.questionBaseIds = [question.nextQuestionBaseId.toString()];
    }
    if (question.assignOperator && !context.operatorAssigned) {
      let shouldAssign = true;

      const queueConfig = await this.configService.get('queue');
      if (queueConfig?.capacity) {
        const queueLength = await this.chatService.getQueueLength();
        if (queueLength >= queueConfig.capacity) {
          shouldAssign = false;
          text = queueConfig.fullMessage.text;
        }
      }

      if (shouldAssign) {
        await this.chatService.addAutoAssignJob(conversationId);
        context.operatorAssigned = true;
      }
    }

    if (text) {
      await this.chatService.createMessage({
        conversationId,
        from: {
          type: UserType.Chatbot,
          id: chatbotId,
        },
        data: { text },
      });
    }
  }
}
