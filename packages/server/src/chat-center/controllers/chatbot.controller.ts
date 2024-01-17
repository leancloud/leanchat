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
import { ChatbotService } from 'src/chat/services';
import { AuthGuard } from '../guards';
import { Roles } from '../decorators';
import { ChatbotDto, CreateChatbotDto } from '../dtos/chatbot';
import { UpdateChatbotDto } from '../dtos/chatbot/update-chatbot.dto';

@Controller('chatbots')
@UseGuards(AuthGuard)
@Roles(OperatorRole.Admin)
@UsePipes(ZodValidationPipe)
export class ChatbotController {
  constructor(private chatbotService: ChatbotService) {}

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
}
