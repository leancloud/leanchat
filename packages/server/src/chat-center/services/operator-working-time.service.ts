import { Injectable } from '@nestjs/common';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { differenceInMilliseconds } from 'date-fns';

import { objectId } from 'src/helpers';
import { CreateOperatorWorkingTimeData } from '../interfaces';
import { OperatorWorkingTime } from '../models/operator-working-time.model';

@Injectable()
export class OperatorWorkingTimeService {
  @InjectModel(OperatorWorkingTime)
  private workingTimeModel: ReturnModelType<typeof OperatorWorkingTime>;

  async create(data: CreateOperatorWorkingTimeData) {
    const wt = new this.workingTimeModel();
    wt.operatorId = objectId(data.operatorId);
    wt.startTime = data.startTime;
    wt.endTime = data.endTime;
    wt.duration = differenceInMilliseconds(data.endTime, data.startTime);
    wt.status = data.status;
    wt.ip = data.ip;
    return await wt.save();
  }
}
