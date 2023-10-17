import { InjectModel } from '@m8a/nestjs-typegoose';
import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';

import { PostprocessingLog } from '../models';
import { CreatePostprocessingLogData } from '../interfaces';

@Injectable()
export class PostprocessingLogService {
  @InjectModel(PostprocessingLog)
  private postprocessingLogModel: ReturnModelType<typeof PostprocessingLog>;

  create(data: CreatePostprocessingLogData) {
    const log = new this.postprocessingLogModel({
      operatorId: data.operatorId,
      startTime: data.startTime,
      endTime: data.endTime,
    });
    return log.save();
  }
}
