import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { ConfigService } from 'src/config';
import {
  ChatService,
  ChatbotQuestionService,
  ChatbotService,
} from '../services';
import { ChatbotMessageJobData } from '../interfaces';
import { UserType } from '../constants';
import { ChatbotRunner } from '../chatbot/chatbot-runner';

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

    const runner = new ChatbotRunner({
      conversationId,
      chatbot,
      context,
      chatService: this.chatService,
      questionService: this.chatbotQuestionService,
      configService: this.configService,
    });

    await runner.run(message.text);

    if (runner.answer) {
      await this.chatService.createMessage({
        conversationId,
        from: {
          type: UserType.Chatbot,
          id: chatbotId,
        },
        data: {
          text: runner.answer,
        },
      });
    }

    if (runner.assignOperator) {
      await this.chatService.addAutoAssignJob(conversationId);
    }

    await this.chatbotService.setContext(conversationId, context);
  }
}
