import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import {
  AnyKeys,
  FilterQuery,
  PipelineStage,
  QuerySelector,
  Types,
} from 'mongoose';
import _ from 'lodash';

import { objectId } from 'src/helpers';
import { Conversation, Message, Visitor } from '../models';
import {
  ConversationFilters,
  CreateConversationData,
  GetConversationMessageStatsOptions,
  GetConversationOptions,
  GetConversationStatsOptions,
  GetInactiveConversationIdsOptions,
  SearchConversationOptions,
  UpdateConversationData,
} from '../interfaces';
import { ConversationCreatedEvent, ConversationUpdatedEvent } from '../events';
import { OperatorService } from './operator.service';
import { ChatError } from '../errors';
import {
  ConsultationResult,
  ConversationStatus,
  MessageType,
} from '../constants';
import { NumberCondition } from '../interfaces/common';

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

  private createConversationQuery({
    status,
    operatorId,
    desc,
    before,
    after,
  }: ConversationFilters) {
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
    return query;
  }

  getConversations({ skip, limit = 10, ...filters }: GetConversationOptions) {
    const query = this.createConversationQuery(filters);
    if (skip) {
      query.skip(skip);
    }
    query.limit(limit);
    return query.exec();
  }

  countConversations(filters: ConversationFilters) {
    const query = this.createConversationQuery(filters);
    return query.countDocuments().exec();
  }

  getOpenConversationCount(operatorId?: string) {
    return this.countConversations({
      operatorId,
      status: ConversationStatus.Open,
    });
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
                    { $not: '$stats.reassigned' },
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

  async searchConversations({
    id,
    from,
    to,
    status,
    channel,
    categoryId,
    visitorId,
    operatorId,
    closedBy,
    evaluation,
    message,
    duration,
    averageResponseTime,
    queued,
    consultationResult,
    skip = 0,
    limit = 10,
    desc,
  }: SearchConversationOptions) {
    const $match: FilterQuery<Conversation> = {};

    if (typeof id === 'string') {
      $match._id = objectId(id);
    } else if (Array.isArray(id) && id.length) {
      $match._id = { $in: objectId(id) };
    }

    if (from && to) {
      $match.createdAt = { $gte: from, $lte: to };
    } else if (from) {
      $match.createdAt = { $gte: from };
    } else if (to) {
      $match.createdAt = { $lte: to };
    }
    if (status) {
      $match.status = status;
    }
    if (channel) {
      $match.channel = channel;
    }
    if (categoryId?.length) {
      $match.categoryId = { $in: objectId(categoryId) };
    }
    if (visitorId?.length) {
      $match.visitorId = { $in: objectId(visitorId) };
    }
    if (operatorId?.length) {
      $match.operatorId = { $in: objectId(operatorId) };
    }
    if (closedBy) {
      $match['closedBy.type'] = closedBy;
    }
    if (evaluation) {
      if (evaluation.invited !== undefined) {
        $match['evaluationInvitedAt'] = {
          $exists: evaluation.invited,
        };
      }
      if (evaluation.star) {
        $match['evaluation.star'] = evaluation.star;
      }
    }
    if (queued !== undefined) {
      $match['queuedAt'] = { $exists: queued };
    }
    if (consultationResult) {
      $match['stats.consultationResult'] = consultationResult;
    }

    const getQuerySelector = (c: NumberCondition) => {
      const q: QuerySelector<number> = {
        $eq: c.eq,
        $gt: c.gt,
        $lt: c.lt,
      };
      return _.omitBy(q, _.isUndefined) as QuerySelector<number>;
    };
    const addNumberQuery = (field: string, c: NumberCondition) => {
      const q = getQuerySelector(c);
      if (!_.isEmpty(q)) {
        $match[field] = q;
      }
    };
    if (duration) {
      addNumberQuery('stats.duration', duration);
    }
    if (averageResponseTime) {
      addNumberQuery('stats.averageResponseTime', averageResponseTime);
    }

    const pipeline: PipelineStage[] = [
      { $match },
      { $sort: { createdAt: desc ? -1 : 1 } },
    ];

    if (message?.text) {
      const $match: FilterQuery<Message> = {
        $expr: {
          $eq: ['$conversationId', '$$cid'],
        },
        type: MessageType.Message,
        'data.text': {
          $regex: message.text,
        },
      };
      if (message.from) {
        $match['from.type'] = message.from;
      }
      pipeline.push(
        {
          $lookup: {
            from: 'message',
            let: { cid: '$_id' },
            pipeline: [{ $match }, { $limit: 1 }],
            as: 'messages',
          },
        },
        {
          $match: {
            $expr: { $ne: ['$messages', []] },
          },
        },
      );
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
      $lookup: {
        from: 'message',
        let: { cid: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$conversationId', '$$cid'] },
              type: MessageType.Assign,
            },
          },
          { $limit: 100 },
        ],
        as: 'transferMessages',
      },
    });

    pipeline.push({
      $lookup: {
        from: 'message',
        let: { cid: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$conversationId', '$$cid'] },
              type: MessageType.Message,
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 1,
          },
        ],
        as: 'lastMessage',
      },
    });

    pipeline.push(
      {
        $addFields: {
          visitor: { $arrayElemAt: ['$visitors', 0] },
          joinedOperatorIds: '$transferMessages.data.operatorId',
          lastMessage: { $arrayElemAt: ['$lastMessage', 0] },
        },
      },
      {
        $project: {
          visitors: 0,
          messages: 0,
          transferMessages: 0,
        },
      },
    );

    pipeline.push({
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'v' }],
      },
    });

    const [result] = await this.conversationModel.aggregate(pipeline);
    return {
      data: result.data,
      totalCount: result.totalCount[0]?.v ?? 0,
    } as {
      data: (Conversation & {
        visitor?: Visitor;
        joinedOperatorIds?: Types.ObjectId[];
        lastMessage?: Message;
      })[];
      totalCount: number;
    };
  }
}
