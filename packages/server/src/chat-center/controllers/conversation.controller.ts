import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ConversationService } from 'src/conversation';
import { MessageService } from 'src/message';
import { AuthGuard } from '../guards/auth.guard';
import { GetConversationsDto } from '../dtos/get-conversations.dto';

@Controller('conversations')
@UseGuards(AuthGuard)
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
}
