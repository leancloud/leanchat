import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { ConversationService } from 'src/conversation';
import { MessageService } from 'src/message';
import { AuthGuard } from '../guards/auth.guard';
import { GetConversationsDto } from '../dtos/get-conversations.dto';
import { UpdateConversationDto } from '../dtos/conversation/update-conversation.dto';

@Controller('conversations')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class ConversationController {
  constructor(
    private conversationService: ConversationService,
    private messageService: MessageService,
  ) {}

  @Get()
  getConversations(@Query() query: GetConversationsDto) {
    return this.conversationService.getConversations(query);
  }

  @Get(':id')
  async getConversation(@Param('id') id: string) {
    const conversation = await this.conversationService.getConversation(id);
    if (!conversation) {
      throw new NotFoundException(`会话 ${id} 不存在`);
    }
    return conversation;
  }

  @Get(':id/messages')
  getConversationMessages(@Param('id') id: string) {
    return this.messageService.getMessages({ conversationId: id });
  }

  @Patch(':id')
  async updateConversation(
    @Param('id') id: string,
    @Body() data: UpdateConversationDto,
  ) {
    const conversation = await this.conversationService.getConversation(id);
    if (!conversation) {
      throw new NotFoundException(`会话 ${id} 不存在`);
    }
    return this.conversationService.updateConversation(conversation, data);
  }
}
