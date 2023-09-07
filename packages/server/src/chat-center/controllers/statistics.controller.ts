import { Controller, Get, Query, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { ConversationStatsService } from 'src/conversation';
import { CountConversationStatsDto } from '../dtos/conversation';

@Controller('statistics')
@UsePipes(ZodValidationPipe)
export class StatisticsController {
  constructor(private conversationStatsService: ConversationStatsService) {}

  @Get('conversation')
  getConversationStats(@Query() query: CountConversationStatsDto) {
    return this.conversationStatsService.getConversationStats(
      query.from,
      query.to,
    );
  }
}
