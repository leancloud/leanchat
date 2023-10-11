import { Controller, Get, Query, UseGuards, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { ConversationService } from 'src/chat/services';
import {
  GetConversationStatsDto,
  GetConversationRecordDto,
} from '../dtos/conversation';
import { AuthGuard } from '../guards/auth.guard';

@Controller('statistics')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class StatisticsController {
  constructor(private conversationService: ConversationService) {}

  @Get('conversation')
  getConversationStatistics(@Query() query: GetConversationStatsDto) {
    return this.conversationService.getConversationStats(query);
  }

  @Get('conversation-message')
  getConversationMessageStatistics(@Query() query: GetConversationStatsDto) {
    return this.conversationService.getConversationMessageStats(query);
  }

  @Get('conversation-record')
  getConversationRecord(@Query() query: GetConversationRecordDto) {
    const { page = 1, pageSize = 10, ...options } = query;
    return this.conversationService.getConversationRecord({
      ...options,
      skip: (page - 1) * pageSize,
      limit: pageSize,
    });
  }
}
