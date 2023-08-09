import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { ConversationService } from 'src/conversation';
import { AuthGuard } from '../guards/auth.guard';

@Controller('conversations')
@UseGuards(AuthGuard)
export class ConversationController {
  constructor(private conversationService: ConversationService) {}

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
      status: 'sloved',
      desc: true,
    });
  }

  @Get('operators/:oid')
  getOperatorConversations(@Param('oid') operatorId: string) {
    return this.conversationService.getConversations({
      operatorId,
      desc: true,
    });
  }
}
