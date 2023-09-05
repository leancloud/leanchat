import {
  BadRequestException,
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

import { ChatbotService } from 'src/chatbot';
import { ChatbotDto, CreateChatbotDto } from '../dtos/chat-bot';
import { UpdateChatbotDto } from '../dtos/chat-bot/update-chat-bot.dto';
import { AuthGuard } from '../guards/auth.guard';

@Controller('chat-bots')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class ChatbotController {
  constructor(private chatbotService: ChatbotService) {}

  @Post()
  async createChatbot(@Body() data: CreateChatbotDto) {
    const result = this.chatbotService.validateChatbotNodes(
      data.nodes,
      data.edges,
    );
    if (!result) {
      throw new BadRequestException('机器人配置不合法');
    }
    const chatbot = await this.chatbotService.createChatbot(data);
    return ChatbotDto.fromDocument(chatbot);
  }

  @Get()
  async getChatbots() {
    const chatbots = await this.chatbotService.getChatbots();
    return chatbots.map(ChatbotDto.fromDocument);
  }

  @Get(':id')
  async getChatbot(@Param('id') id: string) {
    const chatbot = await this.chatbotService.getChatbot(id);
    if (!chatbot) {
      throw new NotFoundException(`聊天机器人 ${id} 不存在`);
    }
    return ChatbotDto.fromDocument(chatbot);
  }

  @Patch(':id')
  async updateChatbot(@Param('id') id: string, @Body() data: UpdateChatbotDto) {
    const chatbot = await this.chatbotService.getChatbot(id);
    if (!chatbot) {
      throw new NotFoundException(`聊天机器人 ${id} 不存在`);
    }
    await this.chatbotService.updateChatbot(chatbot, data);
    return ChatbotDto.fromDocument(chatbot);
  }
}
