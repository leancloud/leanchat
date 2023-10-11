import { InjectModel } from '@m8a/nestjs-typegoose';
import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { FilterQuery, Types } from 'mongoose';
import { startOfMinute } from 'date-fns';

import { OperatorService, OperatorStatus } from 'src/chat';
import { OnlineTime } from '../models/online-time.model';

@Injectable()
export class OnlineTimeService {
  @InjectModel(OnlineTime)
  private onlineTimeModel: ReturnModelType<typeof OnlineTime>;

  constructor(private operatorService: OperatorService) {}

  async recordOnlineTime(operatorIds: string[]) {
    const operators = await this.operatorService.getOperators(operatorIds);

    const time = startOfMinute(new Date());
    const docs = operators.map((operator) => ({
      timestamp: time,
      operatorId: operator.id,
      status: operator.status || OperatorStatus.Leave,
    }));
    try {
      await this.onlineTimeModel.insertMany(docs, { ordered: false });
    } catch {
      // ignore duplicate key error
    }
  }

  async getOnlineTime(from: Date, to: Date, operatorIds?: string[]) {
    const $match: FilterQuery<OnlineTime> = {
      timestamp: {
        $gte: from,
        $lte: to,
      },
    };

    if (operatorIds) {
      $match.operatorId = {
        $in: operatorIds.map((id) => new Types.ObjectId(id)),
      };
    }

    const results = await this.onlineTimeModel
      .aggregate([
        { $match },
        {
          $group: {
            _id: '$operatorId',
            minutes: { $sum: 1 },
          },
        },
      ])
      .exec();

    return results.map((result) => ({
      operatorId: result._id.toString(),
      minutes: result.minutes,
    }));
  }
}
