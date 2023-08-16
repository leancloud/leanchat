import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { ChatBotService } from 'src/chat-bot';
import { CreateChatBotDto } from '../dtos/chat-bot';

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
}
