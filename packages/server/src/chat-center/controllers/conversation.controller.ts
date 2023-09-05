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
import { GetMessagesDto, MessageDto } from '../dtos/message';
import { ConversationDto, UpdateConversationDto } from '../dtos/conversation';

@Controller('conversations')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class ConversationController {
  constructor(
    private conversationService: ConversationService,
    private messageService: MessageService,
  ) {}

  @Get()
  async getConversations(@Query() query: GetConversationsDto) {
    const conversations = await this.conversationService.getConversations(
      query,
    );
    return conversations.map(ConversationDto.fromDocument);
  }

  @Get(':id')
  async getConversation(@Param('id') id: string) {
    const conversation = await this.conversationService.getConversation(id);
    if (!conversation) {
      throw new NotFoundException(`会话 ${id} 不存在`);
    }
    return ConversationDto.fromDocument(conversation);
  }

  @Get(':id/messages')
  async getConversationMessages(
    @Param('id') id: string,
    @Query() query: GetMessagesDto,
  ) {
    const messages = await this.messageService.getMessages({
      ...query,
      conversationId: id,
    });
    return messages.map(MessageDto.fromDocument);
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
    await this.conversationService.updateConversation(conversation, data);
    return ConversationDto.fromDocument(conversation);
  }
}
