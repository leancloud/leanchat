import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Types } from 'mongoose';
import Handlebars from 'handlebars';

import { ChatService, ChatbotService } from '../services';
import { ChatbotMessageJobData } from '../interfaces';
import { ChatbotQuestion } from '../models';
import { UserType } from '../constants';

@Processor('chatbot_message')
export class ChatbotMessageProcessor {
  constructor(
    private chatService: ChatService,
    private chatbotService: ChatbotService,
  ) {}

  @Process()
  async process(job: Job<ChatbotMessageJobData>) {
    const { conversationId, chatbotId, message } = job.data;

    const chatbot = await this.chatbotService.getChatBot(chatbotId);
    if (!chatbot) {
      return;
    }

    const globalProcessed = await this.processQuestionBases(
      conversationId,
      chatbot.globalQuestionBaseIds,
      message,
    );
    if (globalProcessed) {
      return;
    }

    const ctx = await this.chatbotService.getContext(conversationId);
    if (!ctx.questionBaseIds) {
      ctx.questionBaseIds = chatbot.initialQuestionBaseIds.map((id) =>
        id.toHexString(),
      );
    }
    await this.chatbotService.setContext(conversationId, ctx);

    const currentProcessed = await this.processQuestionBases(
      conversationId,
      ctx.questionBaseIds,
      message,
    );
    if (currentProcessed) {
      return;
    }

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

  async processQuestionBases(
    conversationId: string,
    questionBaseIds: string[] | Types.ObjectId[],
    message: ChatbotMessageJobData['message'],
  ) {
    for (const questionBaseId of questionBaseIds) {
      const questions = await this.chatbotService.getQuestions(questionBaseId);
      for (const question of questions) {
        const processed = await this.processQuestion(
          conversationId,
          question,
          message,
        );
        if (processed) {
          return true;
        }
      }
    }
    return false;
  }

  async processQuestion(
    conversationId: string,
    question: ChatbotQuestion,
    message: ChatbotMessageJobData['message'],
  ) {
    if (!question.match(message.text)) {
      return false;
    }

    const template = Handlebars.compile(question.answer.text);
    const context = await this.chatbotService.getContext(conversationId);
    const queuePosition = await this.chatService.getQueuePosition(
      conversationId,
    );
    const text = template({
      context,
      queue: {
        position: queuePosition,
      },
    });

    await this.chatService.createMessage({
      conversationId,
      from: {
        type: UserType.Chatbot,
      },
      data: { text },
    });
    if (question.nextQuestionBaseId) {
      context.questionBaseIds = [question.nextQuestionBaseId.toHexString()];
    }
    if (question.assignOperator && !context.operatorAssigned) {
      await this.chatService.addAutoAssignJob(conversationId);
      context.operatorAssigned = true;
    }
    await this.chatbotService.setContext(conversationId, context);
    return true;
  }
}
