import { InjectModel } from '@m8a/nestjs-typegoose';
import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { FilterQuery, Types } from 'mongoose';
import { startOfMinute } from 'date-fns';

import { ChatService } from 'src/chat';
import { OnlineTime } from '../models/online-time.model';

@Injectable()
export class OnlineTimeService {
  @InjectModel(OnlineTime)
  private onlineTimeModel: ReturnModelType<typeof OnlineTime>;

  constructor(private chatService: ChatService) {}

  async recordOnlineTime(operatorIds: string[]) {
    const statuses = await this.chatService.getOperatorStatuses(operatorIds);

    const time = startOfMinute(new Date());
    const docs = operatorIds.map((operatorId) => ({
      timestamp: time,
      operatorId,
      status: statuses[operatorId] || 'leave',
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
