import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';

import { ConversationService } from 'src/conversation';
import { MessageService } from 'src/message';
import { AuthGuard } from '../guards/auth.guard';

@Controller('conversations')
@UseGuards(AuthGuard)
export class ConversationController {
  constructor(
    private conversationService: ConversationService,
    private messageService: MessageService,
  ) {}

  @Get('queued')
  getQueuedConversatons() {
    return this.conversationService.getConversations({
      status: 'queued',
      sort: 'queuedAt',
      desc: true,
    });
  }

  @Get('solved')
  getSolvedConversations() {
    return this.conversationService.getConversations({
      status: 'solved',
      desc: true,
    });
  }

  @Get('operators/:oid')
  getOperatorConversations(@Param('oid') operatorId: string) {
    return this.conversationService.getConversations({
      operatorId,
      status: 'inProgress',
      desc: true,
    });
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
