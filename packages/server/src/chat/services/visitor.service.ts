import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';

import { Visitor } from '../models/visitor.model';
import { CreateVisitorData } from '../interfaces/visitor.interface';

@Injectable()
export class VisitorService {
  private visitorModel: ReturnModelType<typeof Visitor>;

  createVisitor(data: CreateVisitorData) {
    const visitor = new this.visitorModel({
      channel: data.channel,
      channelId: data.channelId,
    });
    return visitor.save();
  }

  getVisitor(id: string) {
    return this.visitorModel.findById(id);
  }
}
