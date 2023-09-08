import { Injectable } from '@nestjs/common';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { FilterQuery, Types } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { CONVERSATION_STATS_QUEUE, ConversationStatus } from './constants';
import {
  ConversationStatsJobData,
  GetConversationStatsOptions,
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
  }: GetConversationStatsOptions) {
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
                  if: { $gt: ['$timestamps.queuedAt', null] },
                  then: 1,
                  else: 0,
                },
              },
            },
            processed: {
              $sum: {
                $cond: {
                  if: { $gt: ['$timestamps.operatorJoinedAt', null] },
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
            totalResponseTime: { $sum: '$stats.totalResponseTime' },
            totalResponseCount: { $sum: '$stats.totalResponseCount' },
            overtime: {
              $sum: {
                $cond: {
                  if: { $gt: ['$stats.firstReactionTime', 60 * 3] },
                  then: 1,
                  else: 0,
                },
              },
            },
            queuedTime: {
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
      return {};
    }
  }
}
