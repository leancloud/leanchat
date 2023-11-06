import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { AnyKeys, FilterQuery, PipelineStage, Types } from 'mongoose';
import _ from 'lodash';

import { Conversation, Message } from '../models';
import {
  CreateConversationData,
  GetConversationMessageStatsOptions,
  GetConversationOptions,
  GetConversationRecordOptions,
  GetConversationStatsOptions,
  GetInactiveConversationIdsOptions,
  UpdateConversationData,
} from '../interfaces';
import { ConversationCreatedEvent, ConversationUpdatedEvent } from '../events';
import { OperatorService } from './operator.service';
import { ChatError } from '../errors';
import { ConsultationResult, ConversationStatus } from '../constants';

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
      status: ConversationStatus.Open,
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
    status,
    operatorId,
    desc,
    before,
    after,
    skip,
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
    if (status !== undefined) {
      query.where({ status });
    }
    query.sort({ createdAt: desc ? -1 : 1 });
    if (before) {
      query.lt('createdAt', before);
    }
    if (after) {
      query.gt('createdAt', after);
    }
    if (skip) {
      query.skip(skip);
    }
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
      status: data.status,
      operatorId: data.operatorId,
      categoryId: data.categoryId,
      evaluation: data.evaluation,
      evaluationInvitedAt: data.evaluationInvitedAt,
      closedAt: data.closedAt,
      closedBy: data.closedBy,
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
      stats: {
        $exists: true,
      },
    };

    if (channel) {
      $match.channel = channel;
    }
    if (operatorId) {
      $match.operatorId = {
        $in: operatorId.map((id) => new Types.ObjectId(id)),
      };
    }

    const results = await this.conversationModel.aggregate([
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
                  $eq: ['$stats.consultationResult', ConsultationResult.Valid],
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
                  $eq: [
                    '$stats.consultationResult',
                    ConsultationResult.Invalid,
                  ],
                },
                1,
                0,
              ],
            },
          },
          operatorNoResponse: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    '$stats.consultationResult',
                    ConsultationResult.OperatorNoResponse,
                  ],
                },
                1,
                0,
              ],
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
                        '$stats.operatorFirstMessageCreatedAt',
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
    ]);

    return results[0] || {};
  }

  async getConversationMessageStats({
    from,
    to,
    channel,
    operatorId,
  }: GetConversationMessageStatsOptions) {
    const $match: FilterQuery<Conversation> = {
      createdAt: {
        $gte: from,
        $lte: to,
      },
      stats: {
        $exists: true,
      },
    };

    if (channel) {
      $match.channel = channel;
    }
    if (operatorId) {
      $match.operatorId = {
        $in: operatorId.map((id) => new Types.ObjectId(id)),
      };
    }

    const results = await this.conversationModel.aggregate([
      { $match },
      {
        $group: {
          _id: null,
          operatorMessageCount: { $sum: '$stats.operatorMessageCount' },
          visitorMessageCount: { $sum: '$stats.visitorMessageCount' },
        },
      },
    ]);

    return results[0] || {};
  }

  async getConversationRecord({
    from,
    to,
    channel,
    operatorId,
    visitorId,
    messageKeyword,
    messageFrom,
    duration,
    averageResponseTime,
    evaluationStar,
    queued,
    closedBy,
    consultationResult,
    categoryId,
    skip = 0,
    limit = 10,
  }: GetConversationRecordOptions) {
    const $match: FilterQuery<Conversation> = {
      createdAt: {
        $gte: from,
        $lte: to,
      },
      stats: {
        $exists: true,
      },
    };
    if (channel) {
      $match.channel = channel;
    }
    if (operatorId) {
      $match.operatorId = new Types.ObjectId(operatorId);
    }
    if (visitorId) {
      $match.visitorId = new Types.ObjectId(visitorId);
    }
    if (evaluationStar) {
      $match['evaluation.star'] = evaluationStar;
    }
    if (queued !== undefined) {
      $match.queuedAt = { $exists: queued };
    }
    if (closedBy !== undefined) {
      $match['closedBy.type'] = closedBy;
    }
    if (consultationResult !== undefined) {
      $match['stats.consultationResult'] = consultationResult;
    }
    if (categoryId) {
      $match['categoryId'] = new Types.ObjectId(categoryId);
    }

    const exprs: any[] = [];
    if (!_.isEmpty(duration)) {
      if (duration.gt !== undefined) {
        exprs.push({
          $gt: [{ $subtract: ['$closedAt', '$createdAt'] }, duration.gt],
        });
      }
      if (duration.lt !== undefined) {
        exprs.push({
          $lt: [{ $subtract: ['$closedAt', '$createdAt'] }, duration.lt],
        });
      }
    }
    if (averageResponseTime) {
      if (averageResponseTime.gt) {
        exprs.push({
          $gt: ['$stats.averageResponseTime', averageResponseTime.gt],
        });
      }
      if (averageResponseTime.lt) {
        exprs.push({
          $lt: ['$stats.averageResponseTime', averageResponseTime.lt],
        });
      }
    }
    if (exprs.length) {
      if (exprs.length === 1) {
        $match.$expr = exprs[0];
      } else {
        $match.$expr = { $and: exprs };
      }
    }

    const pipeline: PipelineStage[] = [{ $match }, { $sort: { createdAt: 1 } }];

    if (messageKeyword) {
      const $match: FilterQuery<Message> = {
        $expr: {
          $eq: ['$conversationId', '$$cid'],
        },
        type: 'message',
        'data.text': {
          $regex: messageKeyword,
        },
      };
      if (messageFrom !== undefined) {
        $match['from.type'] = messageFrom;
      }
      pipeline.push({
        $lookup: {
          from: 'message',
          let: {
            cid: '$_id',
          },
          pipeline: [{ $match }, { $limit: 1 }],
          as: 'messages',
        },
      });
      pipeline.push({
        $match: {
          $expr: {
            $gt: [{ $size: '$messages' }, 0],
          },
        },
      });
    }

    pipeline.push({
      $lookup: {
        from: 'visitor',
        localField: 'visitorId',
        foreignField: '_id',
        as: 'visitors',
      },
    });

    pipeline.push({
      $project: {
        _id: 0,
        id: '$_id',
        createdAt: 1,
        closedAt: 1,
        visitorId: 1,
        visitorName: {
          $arrayElemAt: ['$visitors.name', 0],
        },
        categoryId: 1,
        evaluation: 1,
        evaluationInvitedAt: 1,
        stats: 1,
        operatorId: 1,
      },
    });

    // pagination
    pipeline.push({
      $facet: {
        items: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    });

    const [result] = await this.conversationModel.aggregate(pipeline);
    return {
      items: result.items,
      totalCount: result.totalCount[0]?.count || 0,
    };
  }
}
