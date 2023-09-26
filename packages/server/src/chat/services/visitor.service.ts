import { Injectable } from '@nestjs/common';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { AnyKeys, Types } from 'mongoose';

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

  getVisitor(id: string | Types.ObjectId) {
    return this.visitorModel.findById(id);
  }

  async getVisitors(ids: string[] | Types.ObjectId[]) {
    if (ids.length === 0) {
      return [];
    }
    if (typeof ids[0] === 'string') {
      ids = ids.map((id) => new Types.ObjectId(id));
    }

    return this.visitorModel.find({ _id: { $in: ids } }).exec();
  }

  getVisitorByChannel(channel: string, channelId: string) {
    return this.visitorModel.findOne({ channel, channelId });
  }

  updateVisitor(visitorId: string, data: UpdateVisitorData) {
    const $set: AnyKeys<Visitor> = {};
    const $unset: AnyKeys<Visitor> = {};

    if (data.currentConversationId) {
      $set.currentConversationId = data.currentConversationId;
    }
    if (data.name !== undefined) {
      if (data.name) {
        $set.name = data.name;
      } else {
        $unset.name = '';
      }
    }
    if (data.comment !== undefined) {
      if (data.comment) {
        $set.comment = data.comment;
      } else {
        $unset.comment = '';
      }
    }

    return this.visitorModel
      .findOneAndUpdate({ _id: visitorId }, { $set, $unset }, { new: true })
      .exec();
  }
}
