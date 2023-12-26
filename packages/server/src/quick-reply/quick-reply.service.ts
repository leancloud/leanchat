import { Injectable } from '@nestjs/common';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { Types } from 'mongoose';

import { objectId } from 'src/helpers';
import { CreateQuickReplyData, UpdateQuickReplyData } from './interfaces';
import { QuickReply, QuickReplyDocument } from './quick-reply.model';

@Injectable()
export class QuickReplyService {
  @InjectModel(QuickReply)
  private quickReplyModel: ReturnModelType<typeof QuickReply>;

  createQuickReply(data: CreateQuickReplyData) {
    const quickReply = new this.quickReplyModel({
      content: data.content,
      tags: data.tags,
      operatorId: data.operatorId,
    });
    return quickReply.save();
  }

  getQuickReplies() {
    return this.quickReplyModel.find().exec();
  }

  getQuickRepliesForOperator(operatorId: string | Types.ObjectId) {
    return this.quickReplyModel
      .find({
        $or: [
          { operatorId: objectId(operatorId) },
          { operatorId: { $exists: false } },
        ],
      })
      .exec();
  }

  getQuickReply(id: string) {
    return this.quickReplyModel.findById(id).exec();
  }

  updateQuickReply(quickReply: QuickReplyDocument, data: UpdateQuickReplyData) {
    if (data.content) {
      quickReply.set('content', data.content);
    }
    if (data.tags) {
      quickReply.set('tags', data.tags);
    }
    if (data.operatorId) {
      quickReply.operatorId = objectId(data.operatorId);
    } else if (data.operatorId === null) {
      quickReply.operatorId = undefined;
    }
    return quickReply.save();
  }

  async deleteQuickReply(quickReply: QuickReplyDocument) {
    return quickReply.deleteOne();
  }
}
