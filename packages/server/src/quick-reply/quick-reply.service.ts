import { Injectable } from '@nestjs/common';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

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
    });
    return quickReply.save();
  }

  getQuickReplies() {
    return this.quickReplyModel.find().exec();
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
    return quickReply.save();
  }

  async deleteQuickReply(quickReply: QuickReplyDocument) {
    return quickReply.deleteOne();
  }
}
