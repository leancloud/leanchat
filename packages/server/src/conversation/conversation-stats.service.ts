import { Injectable } from '@nestjs/common';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { ConversationStats } from './conversation-stats.model';
import { CONVERSATION_STATS_QUEUE } from './constants';
import { ConversationStatsJobData } from './interfaces';

@Injectable()
export class ConversationStatsService {
  @InjectModel(ConversationStats)
  private conversationStatsModel: ReturnModelType<typeof ConversationStats>;

  constructor(
    @InjectQueue(CONVERSATION_STATS_QUEUE)
    private conversationStatsQueue: Queue<ConversationStatsJobData>,
  ) {}

  async getConversationStatsForConversation(conversationId: string) {
    const conversationStats = await this.conversationStatsModel.findOne({
      conversationId,
    });
    if (conversationStats) {
      return conversationStats;
    }
    return this.conversationStatsModel.create({ conversationId });
  }

  private async setFieldWhenNotExists<Field extends keyof ConversationStats>(
    conversationId: string,
    field: Field,
    value: ConversationStats[Field],
  ) {
    try {
      await this.conversationStatsModel.updateOne(
        {
          conversationId,
          [field]: { $exists: false },
        },
        {
          $set: { [field]: value },
        },
        {
          upsert: true,
        },
      );
    } catch (error) {
      // ignore
    }
  }

  async setQueuedAt(conversationId: string, queuedAt: Date) {
    await this.setFieldWhenNotExists(conversationId, 'queuedAt', queuedAt);
  }

  async setOperatorJoinedAt(conversationId: string, operatorJoinedAt: Date) {
    await this.setFieldWhenNotExists(
      conversationId,
      'operatorJoinedAt',
      operatorJoinedAt,
    );
  }

  async pushOperatorIds(conversationId: string, operatorId: string) {
    await this.conversationStatsModel.updateOne(
      { conversationId },
      {
        $addToSet: {
          operatorIds: operatorId,
        },
      },
      { upsert: true },
    );
  }

  async addStatsJob(data: ConversationStatsJobData) {
    await this.conversationStatsQueue.add(data);
  }

  async getConversationStats(from: Date, to: Date) {
    const results = await this.conversationStatsModel
      .aggregate([
        {
          $match: {
            closedAt: {
              $gte: from,
              $lte: to,
            },
          },
        },
        {
          $group: {
            _id: null,
            incoming: { $sum: 1 },
            queued: {
              $sum: {
                $cond: {
                  if: { $gt: ['$queuedAt', null] },
                  then: 1,
                  else: 0,
                },
              },
            },
            processed: {
              $sum: {
                $cond: {
                  if: { $gt: ['$operatorJoinedAt', null] },
                  then: 1,
                  else: 0,
                },
              },
            },
            operatorCommunicated: {
              $sum: {
                $cond: {
                  if: { $gt: ['$operatorMessageCount', 0] },
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
                      { $gt: ['$operatorMessageCount', 0] },
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
                      { $gt: ['$operatorMessageCount', 0] },
                      { $gt: ['$visitorMessageCount', 0] },
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
                      { $gt: ['$operatorMessageCount', 0] },
                      { $eq: ['$visitorMessageCount', 0] },
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
                  if: { $eq: ['$operatorMessageCount', 0] },
                  then: 1,
                  else: 0,
                },
              },
            },
            firstReactionTime: { $sum: '$firstReactionTime' },
            firstReactionCount: {
              $sum: {
                $cond: {
                  if: { $gt: ['$firstReactionTime', 0] },
                  then: 1,
                  else: 0,
                },
              },
            },
            reactionTime: { $sum: '$reactionTime' },
            reactionCount: { $sum: '$reactionCount' },
            overtime: {
              $sum: {
                $cond: {
                  if: { $gt: ['$firstReactionTime', 60 * 3] },
                  then: 1,
                  else: 0,
                },
              },
            },
            queuedTime: {
              $sum: {
                $subtract: ['$operatorJoinedAt', '$queuedAt'],
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
