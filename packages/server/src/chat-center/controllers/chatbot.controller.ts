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

import { OperatorRole } from 'src/chat/constants';
import {
  ChatService,
  ChatbotQuestionService,
  ChatbotService,
} from 'src/chat/services';
import { ConfigService } from 'src/config';
import { ChatbotRunner } from 'src/chat/chatbot/chatbot-runner';
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
    private chatService: ChatService,
    private chatbotService: ChatbotService,
    private chatbotQuestionService: ChatbotQuestionService,
    private configService: ConfigService,
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

    const { context, input } = data;

    const runner = new ChatbotRunner({
      conversationId: 'fake',
      chatbot,
      context,
      chatService: this.chatService,
      questionService: this.chatbotQuestionService,
      configService: this.configService,
    });

    await runner.run(input);

    return {
      context: runner.context,
      text: runner.answer,
    };
  }
}
