import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { FilterQuery, Types } from 'mongoose';

import { Conversation, Message, PostprocessingLog } from '../models';
import { GetOperatorStatsOptions } from '../interfaces';
import { ConsultationResult, MessageType, UserType } from '../constants';

const count = (cond: any) => ({
  $sum: {
    $cond: [cond, 1, 0],
  },
});

export class StatsService {
  @InjectModel(Conversation)
  private conversationModel: ReturnModelType<typeof Conversation>;

  @InjectModel(Message)
  private messageModel: ReturnModelType<typeof Message>;

  @InjectModel(PostprocessingLog)
  private ppLogModel: ReturnModelType<typeof PostprocessingLog>;

  async getOperatorConversationStats({
    from,
    to,
    operatorId,
  }: GetOperatorStatsOptions) {
    const $match: FilterQuery<Conversation> = {
      createdAt: { $gte: from, $lte: to },
      stats: { $exists: true },
    };

    if (operatorId?.length) {
      $match.operatorId = {
        $in: operatorId.map((id) => new Types.ObjectId(id)),
      };
    }

    const sumValid = (expr: any) => ({
      $sum: {
        $cond: [
          {
            $eq: ['$stats.consultationResult', ConsultationResult.Valid],
          },
          expr,
          0,
        ],
      },
    });

    const countValid = (cond: any) => ({
      $sum: {
        $cond: [
          {
            $and: [
              {
                $eq: ['$stats.consultationResult', ConsultationResult.Valid],
              },
              cond,
            ],
          },
          1,
          0,
        ],
      },
    });

    const results = await this.conversationModel.aggregate([
      { $match },
      {
        $group: {
          _id: '$operatorId',
          totalCount: { $sum: 1 },
          validCount: count({
            $eq: ['$stats.consultationResult', ConsultationResult.Valid],
          }),
          invalidCount: count({
            $eq: ['$stats.consultationResult', ConsultationResult.Invalid],
          }),
          operatorNoResponseCount: count({
            $eq: [
              '$stats.consultationResult',
              ConsultationResult.OperatorNoResponse,
            ],
          }),
          averageFirstResponseTime: {
            $avg: '$stats.firstResponseTime',
          },
          maxResponseTime: {
            $max: '$stats.maxResponseTime',
          },
          responseTime: {
            $sum: '$stats.responseTime',
          },
          responseCount: {
            $sum: '$stats.responseCount',
          },
          messageCount: {
            $sum: {
              $add: [
                '$stats.visitorMessageCount',
                '$stats.operatorMessageCount',
              ],
            },
          },
          validDuration: sumValid({
            $subtract: ['$closedAt', '$createdAt'],
          }),
          validReceptionTime: sumValid('$stats.receptionTime'),
          validEvaluationCount: countValid('$evaluation'),
          validEvaluationInvitationCount: countValid('$evaluationInvitedAt'),
          ...[1, 2, 3, 4, 5].reduce<any>((pipeline, star) => {
            pipeline[`evaluationStar${star}`] = countValid({
              $eq: ['$evaluation.star', star],
            });
            return pipeline;
          }, {}),
        },
      },
    ]);

    return results;
  }

  async getOperatorTransferStats({
    from,
    to,
    operatorId,
  }: GetOperatorStatsOptions) {
    const inMatch: FilterQuery<Message> = {
      createdAt: { $gte: from, $lte: to },
      type: MessageType.Assign,
      'from.type': UserType.Operator,
      $expr: {
        $ne: ['$from.id', '$data.toOperatorId'],
      },
    };

    const outMatch: FilterQuery<Message> = {
      createdAt: { $gte: from, $lte: to },
      type: MessageType.Assign,
      'from.type': UserType.Operator,
      $expr: {
        $eq: ['$from.id', '$data.fromOperatorId'],
      },
    };

    if (operatorId?.length) {
      const operatorObjectIds = operatorId.map((id) => new Types.ObjectId(id));
      inMatch['data.toOperatorId'] = {
        $in: operatorObjectIds,
      };
      outMatch['data.fromOperatorId'] = {
        $in: operatorObjectIds,
      };
    }

    const results = await this.messageModel.aggregate([
      {
        $facet: {
          in: [
            { $match: inMatch },
            {
              $group: {
                _id: '$data.toOperatorId',
                count: { $sum: 1 },
              },
            },
          ],
          out: [
            { $match: outMatch },
            {
              $group: {
                _id: '$data.fromOperatorId',
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    return results[0] as {
      in: {
        _id: Types.ObjectId;
        count: number;
      }[];
      out: {
        _id: Types.ObjectId;
        count: number;
      }[];
    };
  }

  async getPostprocessingStats({
    from,
    to,
    operatorId,
  }: GetOperatorStatsOptions) {
    const $match: FilterQuery<PostprocessingLog> = {
      $or: [{ startTime: { $gte: from } }, { endTime: { $lte: to } }],
    };

    if (operatorId?.length) {
      $match.operatorId = {
        $in: operatorId.map((id) => new Types.ObjectId(id)),
      };
    }

    const results = await this.ppLogModel.aggregate([
      { $match },
      {
        $group: {
          _id: '$operatorId',
          count: { $sum: 1 },
          duration: {
            $sum: {
              $subtract: [
                { $min: [to, '$endTime'] },
                { $max: [from, '$startTime'] },
              ],
            },
          },
        },
      },
    ]);

    return results;
  }
}
