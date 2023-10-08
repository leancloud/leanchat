import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { AnyKeys, FilterQuery, Types } from 'mongoose';
import _ from 'lodash';

import { Conversation } from '../models';
import {
  CreateConversationData,
  GetConversationOptions,
  GetConversationStatsOptions,
  GetInactiveConversationIdsOptions,
  UpdateConversationData,
} from '../interfaces';
import { ConversationCreatedEvent, ConversationUpdatedEvent } from '../events';
import { OperatorService } from './operator.service';
import { ChatError } from '../errors';

@Injectable()
export class ConversationService {
  @InjectModel(Conversation)
  private conversationModel: ReturnModelType<typeof Conversation>;

  constructor(
    private events: EventEmitter2,
    private operatorService: OperatorService,
  ) {}

  async createConversation(data: CreateConversationData) {
    const conversation = new this.conversationModel({
      channel: data.channel,
      visitorId: data.visitorId,
    });
    await conversation.save();

    this.events.emit('conversation.created', {
      conversation,
    } satisfies ConversationCreatedEvent);

    return conversation;
  }

  getConversation(id: string | Types.ObjectId) {
    return this.conversationModel.findById(id).exec();
  }

  getConversations({
    operatorId,
    status,
    desc,
    limit = 10,
  }: GetConversationOptions) {
    const query = this.conversationModel.find();
    if (operatorId !== undefined) {
      if (operatorId === null) {
        query.where({ operatorId: { $exists: false } });
      } else {
        query.where({ operatorId });
      }
    }
    if (status) {
      query.where({ closedAt: { $exists: status === 'closed' } });
    }
    query.sort({ createdAt: desc ? 1 : -1 });
    query.limit(limit);
    return query.exec();
  }

  async getInactiveConversationIds({
    lastActivityBefore,
    limit,
  }: GetInactiveConversationIdsOptions) {
    const results = await this.conversationModel
      .aggregate([
        {
          $match: {
            closedAt: { $exists: false },
            $expr: {
              $gte: ['$operatorLastActivityAt', '$visitorLastActivityAt'],
            },
            operatorLastActivityAt: {
              $lte: lastActivityBefore,
            },
          },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            _id: 1,
          },
        },
      ])
      .exec();

    return results.map((result) => result._id.toString()) as string[];
  }

  async updateConversation(
    id: string | Types.ObjectId,
    data: UpdateConversationData,
  ) {
    data = _.omitBy(data, _.isUndefined);
    if (_.isEmpty(data)) {
      return;
    }

    if (data.operatorId) {
      const operator = await this.operatorService.getOperator(data.operatorId);
      if (!operator) {
        throw new ChatError('OPERATOR_NOT_EXIST');
      }
    }

    const $set: AnyKeys<Conversation> = {
      operatorId: data.operatorId,
      categoryId: data.categoryId,
      evaluation: data.evaluation,
      closedAt: data.closedAt,
      queuedAt: data.queuedAt,
      visitorLastActivityAt: data.visitorLastActivityAt,
      operatorLastActivityAt: data.operatorLastActivityAt,
      stats: data.stats,
    };

    const $unset: AnyKeys<Conversation> = {};

    if (data.visitorWaitingSince) {
      $set.visitorWaitingSince = data.visitorWaitingSince;
    } else if (data.visitorWaitingSince === null) {
      $unset.visitorWaitingSince = '';
    }

    const conversation = await this.conversationModel
      .findOneAndUpdate({ _id: id }, { $set, $unset }, { new: true })
      .exec();

    if (conversation) {
      this.events.emit('conversation.updated', {
        conversation,
        data,
      } satisfies ConversationUpdatedEvent);
    }

    return conversation;
  }

  getOpenConversationCount(operatorId: string) {
    return this.conversationModel
      .count({
        operatorId,
        closedAt: {
          $exists: false,
        },
      })
      .exec();
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
      closedAt: {
        $exists: true,
      },
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
                $cond: ['$queuedAt', 1, 0],
              },
            },
            queuedAndConnected: {
              $sum: {
                $cond: ['$stats.queueConnectionTime', 1, 0],
              },
            },
            queuedAndLeft: {
              $sum: {
                $cond: ['$stats.queueTimeToLeave', 1, 0],
              },
            },
            operatorCommunicated: {
              $sum: {
                $cond: ['$stats.operatorMessageCount', 1, 0],
              },
            },
            operatorIndependentCommunicated: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      '$stats.operatorMessageCount',
                      { $eq: [{ $size: '$stats.joinedOperatorIds' }, 1] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            valid: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      '$stats.operatorMessageCount',
                      '$stats.visitorMessageCount',
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            invalid: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gt: ['$stats.operatorMessageCount', 0] },
                      { $eq: ['$stats.visitorMessageCount', 0] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            operatorNoResponse: {
              $sum: {
                $cond: [{ $eq: ['$stats.operatorMessageCount', 0] }, 1, 0],
              },
            },
            receptionTime: { $sum: '$stats.receptionTime' },
            receptionCount: {
              $sum: {
                $cond: ['$stats.receptionTime', 1, 0],
              },
            },
            firstResponseTime: { $sum: '$stats.firstResponseTime' },
            firstResponseCount: {
              $sum: {
                $cond: ['$stats.firstResponseTime', 1, 0],
              },
            },
            responseTime: { $sum: '$stats.responseTime' },
            responseCount: { $sum: '$stats.responseCount' },
            overtime: {
              $sum: {
                $cond: [
                  {
                    $gt: [
                      {
                        $subtract: [
                          '$stats.firstOperatorMessageCreatedAt',
                          '$stats.firstOperatorJoinedAt',
                        ],
                      },
                      60 * 1000 * 3,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            queueConnectionTime: {
              $sum: '$stats.queueConnectionTime',
            },
            queueTimeToLeave: {
              $sum: '$stats.queueTimeToLeave',
            },
          },
        },
      ])
      .exec();

    return results[0];
  }
}
