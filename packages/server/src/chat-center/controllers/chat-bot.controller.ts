import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { ChatBotService } from 'src/chat-bot';
import { CreateChatBotDto } from '../dtos/chat-bot';
import { UpdateChatBotDto } from '../dtos/chat-bot/update-chat-bot.dto';

@Controller('chat-bots')
@UsePipes(ZodValidationPipe)
export class ChatBotController {
  constructor(private chatBotService: ChatBotService) {}

  @Post()
  createChatBot(@Body() data: CreateChatBotDto) {
    const result = this.chatBotService.validateChatBotNodes(data.nodes);
    if (!result) {
      throw new BadRequestException('机器人配置不合法');
    }
    return this.chatBotService.createChatBot(data);
  }

  @Get()
  getChatBots() {
    return this.chatBotService.getChatBots();
  }

  @Get(':id')
  async getChatBot(@Param('id') id: string) {
    const chatBot = await this.chatBotService.getChatBot(id);
    if (!chatBot) {
      throw new NotFoundException(`聊天机器人 ${id} 不存在`);
    }
    return chatBot;
  }

  @Patch(':id')
  async updateChatBot(@Param('id') id: string, @Body() data: UpdateChatBotDto) {
    const chatBot = await this.chatBotService.getChatBot(id);
    if (!chatBot) {
      throw new NotFoundException(`聊天机器人 ${id} 不存在`);
    }
    await this.chatBotService.updateChatBot(chatBot, data);
  }
}
