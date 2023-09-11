import { Controller, Get, Query, UseGuards, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { ConversationStatsService } from 'src/conversation';
import { GetConversationStatsDto } from '../dtos/conversation';
import { AuthGuard } from '../guards/auth.guard';

@Controller('statistics')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class StatisticsController {
  constructor(private conversationStatsService: ConversationStatsService) {}

  @Get('conversation')
  getConversationStatistics(@Query() query: GetConversationStatsDto) {
    return this.conversationStatsService.getConversationStatistics(query);
  }

  @Get('conversation-message')
  getConversationMessageStatistics(@Query() query: GetConversationStatsDto) {
    return this.conversationStatsService.getConversationMessageStatistics(
      query,
    );
  }
}
