import { Injectable } from '@nestjs/common';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { Visitor } from '../models/visitor.model';
import { UpdateVisitorData } from '../interfaces/visitor.interface';

@Injectable()
export class VisitorService {
  @InjectModel(Visitor)
  private visitorModel: ReturnModelType<typeof Visitor>;

  createVisitor() {
    const visitor = new this.visitorModel();
    return visitor.save();
  }

  getVisitor(id: string) {
    return this.visitorModel.findById(id);
  }

  getVisitorByChannel(channel: string, channelId: string) {
    return this.visitorModel.findOne({ channel, channelId });
  }

  updateVisitor(visitorId: string, data: UpdateVisitorData) {
    return this.visitorModel
      .findOneAndUpdate(
        { _id: visitorId },
        {
          $set: {
            currentConversationId: data.currentVisitorId,
            name: data.name,
            comment: data.comment,
          },
        },
        {
          new: true,
        },
      )
      .exec();
  }
}
