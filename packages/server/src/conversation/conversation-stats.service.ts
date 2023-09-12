import { Injectable } from '@nestjs/common';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { FilterQuery, PipelineStage, Types } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { CONVERSATION_STATS_QUEUE, ConversationStatus } from './constants';
import {
  ConversationMessageStatistics,
  ConversationStatistics,
  ConversationStatsJobData,
  GetConversationRecordStatsOptions,
  GetConversationStatsOptions,
  NumberCondition,
} from './interfaces';
import { Conversation } from './conversation.model';

@Injectable()
export class ConversationStatsService {
  @InjectModel(Conversation)
  private conversationModel: ReturnModelType<typeof Conversation>;

  constructor(
    @InjectQueue(CONVERSATION_STATS_QUEUE)
    private conversationStatsQueue: Queue<ConversationStatsJobData>,
  ) {}

  async addStatsJob(data: ConversationStatsJobData) {
    await this.conversationStatsQueue.add(data);
  }

  async getConversationStats({
    from,
    to,
    channel,
    operatorId,
  }: GetConversationStatsOptions): Promise<ConversationStatistics> {
    const $match: FilterQuery<Conversation> = {
      createdAt: {
        $gte: from,
        $lte: to,
      },
      status: ConversationStatus.Solved,
    };

    if (channel) {
      $match.channel = channel;
    }
    if (operatorId) {
      if (Array.isArray(operatorId)) {
        $match.operatorId = {
          $in: operatorId.map((id) => new Types.ObjectId(id)),
        };
      } else {
        $match.operatorId = new Types.ObjectId(operatorId);
      }
    }

    const results = await this.conversationModel
      .aggregate([
        { $match },
        {
          $group: {
            _id: null,
            incoming: { $sum: 1 },
            queued: {
              $sum: {
                $cond: {
                  if: '$timestamps.queuedAt',
                  then: 1,
                  else: 0,
                },
              },
            },
            queuedAndLeft: {
              $sum: {
                $cond: {
                  if: {
                    $and: [
                      '$timestamps.queuedAt',
                      '$timestamps.visitorClosedAt',
                      { $not: ['$timestamps.operatorJoinedAt'] },
                    ],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            queuedAndProcessed: {
              $sum: {
                $cond: {
                  if: {
                    $and: [
                      '$timestamps.queuedAt',
                      '$timestamps.operatorJoinedAt',
                    ],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            notQueued: {
              $sum: {
                $cond: {
                  if: {
                    $and: [
                      { $not: ['$timestamps.queuedAt'] },
                      '$timestamps.operatorJoinedAt',
                    ],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            operatorCommunicated: {
              $sum: {
                $cond: {
                  if: { $gt: ['$stats.operatorMessageCount', 0] },
                  then: 1,
                  else: 0,
                },
              },
            },
            oneOperatorCommunicated: {
              $sum: {
                $cond: {
                  if: {
                    $and: [
                      { $gt: ['$stats.operatorMessageCount', 0] },
                      { $eq: [{ $size: '$operatorIds' }, 1] },
                    ],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            valid: {
              $sum: {
                $cond: {
                  if: {
                    $and: [
                      { $gt: ['$stats.operatorMessageCount', 0] },
                      { $gt: ['$stats.visitorMessageCount', 0] },
                    ],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            invalid: {
              $sum: {
                $cond: {
                  if: {
                    $and: [
                      { $gt: ['$stats.operatorMessageCount', 0] },
                      { $eq: ['$stats.visitorMessageCount', 0] },
                    ],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            noResponse: {
              $sum: {
                $cond: {
                  if: { $eq: ['$stats.operatorMessageCount', 0] },
                  then: 1,
                  else: 0,
                },
              },
            },
            receptionTime: { $sum: '$stats.receptionTime' },
            receptionCount: {
              $sum: {
                $cond: {
                  if: { $gt: ['$stats.receptionTime', 0] },
                  then: 1,
                  else: 0,
                },
              },
            },
            firstResponseTime: { $sum: '$stats.firstResponseTime' },
            firstResponseCount: {
              $sum: {
                $cond: {
                  if: { $gt: ['$stats.firstResponseTime', 0] },
                  then: 1,
                  else: 0,
                },
              },
            },
            responseTime: { $sum: '$stats.responseTime' },
            responseCount: { $sum: '$stats.responseCount' },
            overtime: {
              $sum: {
                $cond: {
                  if: { $gt: ['$stats.firstResponseTime', 60 * 1000 * 3] },
                  then: 1,
                  else: 0,
                },
              },
            },
            queuedAndLeftTime: {
              $sum: {
                $cond: {
                  if: {
                    $and: [
                      '$timestamps.queuedAt',
                      '$timestamps.visitorClosedAt',
                      { $not: ['$timestamps.operatorJoinedAt'] },
                    ],
                  },
                  then: {
                    $subtract: [
                      '$timestamps.visitorClosedAt',
                      '$timestamps.queuedAt',
                    ],
                  },
                  else: 0,
                },
              },
            },
            queuedAndProcessedTime: {
              $sum: {
                $subtract: [
                  '$timestamps.operatorJoinedAt',
                  '$timestamps.queuedAt',
                ],
              },
            },
          },
        },
      ])
      .exec();

    if (results.length) {
      const result = results[0];
      delete result._id;
      return result;
    } else {
      return {
        incoming: 0,
        queued: 0,
        queuedAndLeft: 0,
        queuedAndProcessed: 0,
        notQueued: 0,
        operatorCommunicated: 0,
        oneOperatorCommunicated: 0,
        valid: 0,
        invalid: 0,
        noResponse: 0,
        receptionTime: 0,
        receptionCount: 0,
        firstResponseTime: 0,
        firstResponseCount: 0,
        responseTime: 0,
        responseCount: 0,
        overtime: 0,
        queuedAndLeftTime: 0,
        queuedAndProcessedTime: 0,
      };
    }
  }

  async getConversationMessageStats({
    from,
    to,
    channel,
    operatorId,
  }: GetConversationStatsOptions): Promise<ConversationMessageStatistics> {
    const $match: FilterQuery<Conversation> = {
      createdAt: {
        $gte: from,
        $lte: to,
      },
      status: ConversationStatus.Solved,
    };

    if (channel) {
      $match.channel = channel;
    }
    if (operatorId) {
      if (Array.isArray(operatorId)) {
        $match.operatorId = {
          $in: operatorId.map((id) => new Types.ObjectId(id)),
        };
      } else {
        $match.operatorId = new Types.ObjectId(operatorId);
      }
    }

    const [result] = await this.conversationModel.aggregate([
      { $match },
      {
        $group: {
          _id: null,
          operatorMessageCount: { $sum: '$stats.operatorMessageCount' },
          visitorMessageCount: { $sum: '$stats.visitorMessageCount' },
        },
      },
    ]);

    if (result) {
      delete result._id;
      return result;
    }

    return {
      operatorMessageCount: 0,
      visitorMessageCount: 0,
    };
  }

  async getConversationRecordStats({
    from,
    to,
    channel,
    visitorId,
    operatorId,
    keyword,
    duration,
    averageResponseTime,
    evaluationStar,
    limit = 10,
    desc,
  }: GetConversationRecordStatsOptions) {
    const $match: FilterQuery<Conversation> = {
      createdAt: {
        $gte: from,
        $lte: to,
      },
    };

    const addNumberCondition = (path: string, cond: NumberCondition) => {
      if (cond.gt) {
        $match[path] = { $gt: cond.gt };
      }
      if (cond.lt) {
        $match[path] = { $lt: cond.lt };
      }
    };

    if (channel) {
      $match.channel = channel;
    }
    if (visitorId) {
      $match.visitorId = new Types.ObjectId(visitorId);
    }
    if (operatorId) {
      $match.operatorId = new Types.ObjectId(operatorId);
    }
    if (evaluationStar) {
      $match['evaluation.star'] = evaluationStar;
    }
    if (duration) {
      addNumberCondition('stats.duration', duration);
    }
    if (averageResponseTime) {
      addNumberCondition('stats.averageResponseTime', averageResponseTime);
    }

    const pipeline: PipelineStage[] = [
      { $match },
      { $sort: { createdAt: desc ? -1 : 1 } },
    ];

    if (keyword) {
      pipeline.push(
        {
          $lookup: {
            from: 'message',
            let: {
              cid: '$_id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$conversationId', '$$cid'],
                  },
                  type: 'message',
                },
              },
              { $limit: 10 },
            ],
            as: 'messages',
          },
        },
        {
          $match: {
            'messages.data.content': {
              $regex: keyword,
            },
          },
        },
      );
    }

    return await this.conversationModel.aggregate([
      ...pipeline,
      { $limit: limit },
      {
        $project: {
          _id: 0,
          id: '$_id',
          visitorid: 1,
          operatorId: 1,
          categoryId: 1,
          evaluation: 1,
          timestamps: 1,
          stats: 1,
          duration: 1,
          createdAt: 1,
        },
      },
    ]);
  }
}
