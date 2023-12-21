import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import _ from 'lodash';

import {
  ChatService,
  ConversationService,
  StatsService,
} from 'src/chat/services';
import { GetConversationStatsDto } from '../dtos/conversation';
import { AuthGuard } from '../guards/auth.guard';
import {
  GetEvaluationStatsDto,
  GetOperatorStatsDto,
  GetOperatorWorkingTimeDto,
} from '../dtos/stats';
import { OperatorOnlineService, OperatorWorkingTimeService } from '../services';

@Controller('statistics')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class StatisticsController {
  constructor(
    private conversationService: ConversationService,
    private statsService: StatsService,
    private operatorOnlineService: OperatorOnlineService,
    private operatorWorkingTimeService: OperatorWorkingTimeService,
    private chatService: ChatService,
  ) {}

  @Get('conversation')
  getConversationStatistics(@Query() query: GetConversationStatsDto) {
    return this.conversationService.getConversationStats(query);
  }

  @Get('conversation-message')
  getConversationMessageStatistics(@Query() query: GetConversationStatsDto) {
    return this.conversationService.getConversationMessageStats(query);
  }

  @Get('operator')
  async getOperatorStats(@Query() query: GetOperatorStatsDto) {
    const conversationStats =
      await this.statsService.getOperatorConversationStats(query);

    const onlineStats = await this.operatorOnlineService.getOnlineTimeStats(
      query.from,
      query.to,
      query.operatorId,
    );

    const transferStats = await this.statsService.getOperatorTransferStats(
      query,
    );

    const postprocessingStats = await this.statsService.getPostprocessingStats(
      query,
    );

    const normalize = (items: any[], key: string) => {
      return items.map(({ _id, ...rest }) => ({
        id: _id.toHexString(),
        [key]: rest,
      }));
    };

    const mergeObjectArray = (items: any[]) =>
      items.reduce((result, current) => Object.assign(result, current), {});

    return _.chain([
      normalize(conversationStats, 'conversation'),
      normalize(onlineStats, 'online'),
      normalize(transferStats.in, 'transferIn'),
      normalize(transferStats.out, 'transferOut'),
      normalize(postprocessingStats, 'postprocessing'),
    ])
      .flatten()
      .groupBy('id')
      .mapValues(mergeObjectArray)
      .values()
      .value();
  }

  @Get('operators/:id/working-time')
  async getOperatorWorkingTime(
    @Param('id') id: string,
    @Query() query: GetOperatorWorkingTimeDto,
  ) {
    const { from, to, page = 1, pageSize = 10 } = query;
    const { data: rawData, totalCount } =
      await this.operatorWorkingTimeService.list({
        operatorId: id,
        from,
        to,
        skip: (page - 1) * pageSize,
        limit: pageSize,
      });
    const data = rawData.map((item) => ({
      id: item.id,
      operatorId: item.operatorId.toHexString(),
      startTime: item.startTime.toISOString(),
      endTime: item.endTime.toISOString(),
      duration: item.duration,
      ip: item.ip,
      status: item.status,
    }));
    return { data, totalCount };
  }

  @Get('evaluation')
  getEvaluationStats(@Query() query: GetEvaluationStatsDto) {
    const { page = 1, pageSize = 10, ...options } = query;
    return this.statsService.getEvaluationStats({
      ...options,
      skip: (page - 1) * pageSize,
      limit: pageSize,
    });
  }

  @Get('work')
  async getWorkStats() {
    const openCount = await this.conversationService.getOpenConversationCount();
    const totalCount = await this.conversationService.countConversations({});
    const queueLength = await this.chatService.getQueueLength();
    const earliestEnqueueTime =
      await this.chatService.getTheEarliestEnqueueTime();
    const maxQueueingTime =
      earliestEnqueueTime && Date.now() - earliestEnqueueTime.getTime();
    return {
      openCount,
      totalCount,
      queueLength,
      maxQueueingTime,
    };
  }
}
