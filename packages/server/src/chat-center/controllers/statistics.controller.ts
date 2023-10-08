import { Controller, Get, Query, UseGuards, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { ConversationService } from 'src/chat/services';
import {
  GetConversationStatsDto,
  GetConversationRecordStatsDto,
} from '../dtos/conversation';
import { AuthGuard } from '../guards/auth.guard';

@Controller('statistics')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class StatisticsController {
  constructor(private conversationService: ConversationService) {}

  @Get('conversation')
  async getConversationStatistics(@Query() query: GetConversationStatsDto) {
    const stats = await this.conversationService.getConversationStats(query);
    return stats || {};
  }

  @Get('conversation-message')
  getConversationMessageStatistics(@Query() query: GetConversationStatsDto) {
    // return this.conversationStatsService.getConversationMessageStats(query);
  }

  @Get('conversation-record')
  queryConversations(@Query() query: GetConversationRecordStatsDto) {
    // return this.conversationStatsService.getConversationRecordStats(query);
  }
}
