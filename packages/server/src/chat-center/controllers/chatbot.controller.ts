import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import Handlebars from 'handlebars';

import { OperatorRole } from 'src/chat/constants';
import { ChatbotContext } from 'src/chat/interfaces';
import { ChatbotQuestion } from 'src/chat/models';
import { ChatbotQuestionService, ChatbotService } from 'src/chat/services';
import { AuthGuard } from '../guards';
import { Roles } from '../decorators';
import {
  ChatbotDto,
  CreateChatbotDto,
  TestChatbotDto,
  UpdateChatbotDto,
} from '../dtos/chatbot';

@Controller('chatbots')
@UseGuards(AuthGuard)
@Roles(OperatorRole.Admin)
@UsePipes(ZodValidationPipe)
export class ChatbotController {
  constructor(
    private chatbotService: ChatbotService,
    private chatbotQuestionService: ChatbotQuestionService,
  ) {}

  @Post()
  async createChatbot(@Body() data: CreateChatbotDto) {
    const chatbot = await this.chatbotService.create({
      name: data.name,
      acceptRule: data.acceptRule,
      globalQuestionBaseIds: data.globalQuestionBaseIds || [],
      initialQuestionBaseIds: data.initialQuestionBaseIds || [],
      greetingMessage: data.greetingMessage,
      noMatchMessage: data.noMatchMessage,
    });
    return ChatbotDto.fromDocument(chatbot);
  }

  @Patch(':id')
  async updateChatbot(@Param('id') id: string, @Body() data: UpdateChatbotDto) {
    const chatbot = await this.chatbotService.update(id, data);
    if (!chatbot) {
      throw new NotFoundException('机器人不存在');
    }
    return ChatbotDto.fromDocument(chatbot);
  }

  @Get()
  async getChatbots() {
    const chatbots = await this.chatbotService.getChatbots();
    return chatbots.map(ChatbotDto.fromDocument);
  }

  @Get(':id')
  async getChatbot(@Param('id') id: string) {
    const chatbot = await this.chatbotService.getChatBot(id);
    if (!chatbot) {
      throw new NotFoundException('机器人不存在');
    }
    return ChatbotDto.fromDocument(chatbot);
  }

  @Post(':id/test')
  async testChatbot(@Param('id') id: string, @Body() data: TestChatbotDto) {
    const chatbot = await this.chatbotService.getChatBot(id);
    if (!chatbot) {
      throw new NotFoundException('机器人不存在');
    }

    const processQuestion = (
      question: ChatbotQuestion,
      context: ChatbotContext,
      switchBase = true,
    ) => {
      const template = Handlebars.compile(question.answer.text);
      const text = template({ context }).trim();

      if (switchBase && question.nextQuestionBaseId) {
        context.questionBaseIds = [question.nextQuestionBaseId.toString()];
      }
      if (question.assignOperator) {
        context.operatorAssigned = true;
      }

      return { context, text };
    };

    const { context, input } = data;

    if (chatbot.globalQuestionBaseIds.length) {
      const question = await this.chatbotQuestionService.matchQuestion(
        chatbot.globalQuestionBaseIds,
        input,
      );
      if (question) {
        return processQuestion(question, context);
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
        input,
      );
      if (question) {
        return processQuestion(question, context, true);
      }
    }

    return {
      context,
      text: chatbot.noMatchMessage.text,
    };
  }
}
