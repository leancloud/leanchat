import { Injectable } from '@nestjs/common';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { Visitor, VisitorDocument } from './visitor.model';
import { UpdateVisitorData } from './interfaces';

@Injectable()
export class VisitorService {
  @InjectModel(Visitor)
  private visitorModel: ReturnModelType<typeof Visitor>;

  getVisitor(id: string) {
    return this.visitorModel.findById(id).exec();
  }

  async registerVisitorFromChatChannel(chatId: string) {
    const existVisitor = await this.visitorModel.findOne({ chatId }).exec();
    if (existVisitor) {
      return existVisitor;
    }

    const visitor = new this.visitorModel({
      channel: 'chat',
      chatId,
    });
    return visitor.save();
  }

  updateVisitor(visitor: VisitorDocument, data: UpdateVisitorData) {
    if (data.currentConversationId) {
      visitor.set('currentConversation', data.currentConversationId);
    }
    return visitor.save();
  }
}
