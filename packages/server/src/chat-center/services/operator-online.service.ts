import { InjectModel } from '@m8a/nestjs-typegoose';
import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { FilterQuery, Types } from 'mongoose';
import { startOfMinute, subDays } from 'date-fns';

import { OperatorService, OperatorStatus } from 'src/chat';
import { OperatorOnlineRecord } from '../models/operator-online-record.model';

@Injectable()
export class OperatorOnlineService {
  @InjectModel(OperatorOnlineRecord)
  private onlineRecordModel: ReturnModelType<typeof OperatorOnlineRecord>;

  constructor(private operatorService: OperatorService) {}

  async createOnlineRecord(operatorIds: string[]) {
    const operators = await this.operatorService.getOperators(operatorIds);

    const time = startOfMinute(new Date());
    const docs = operators.map((operator) => ({
      timestamp: time,
      operatorId: operator.id,
      status: operator.status ?? OperatorStatus.Leave,
    }));
    try {
      await this.onlineRecordModel.insertMany(docs, { ordered: false });
    } catch {
      // ignore duplicate key error
    }
  }

  async gc(daysBefore = 180) {
    await this.onlineRecordModel.deleteMany({
      timestamp: {
        $lt: subDays(new Date(), daysBefore),
      },
    });
  }

  async getOnlineTimeStats(from: Date, to: Date, operatorIds?: string[]) {
    const $match: FilterQuery<OperatorOnlineRecord> = {
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

    const count = (cond: any) => ({
      $sum: {
        $cond: [cond, 1, 0],
      },
    });

    const results = await this.onlineRecordModel.aggregate([
      { $match },
      {
        $group: {
          _id: '$operatorId',
          totalTime: { $sum: 1 },
          readyTime: count({ $eq: ['$status', OperatorStatus.Ready] }),
          busyTime: count({ $eq: ['$status', OperatorStatus.Busy] }),
          leaveTime: count({ $eq: ['$status', OperatorStatus.Leave] }),
        },
      },
    ]);

    return results;
  }
}
