import { Injectable } from '@nestjs/common';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { Conversation } from '../models/conversation.model';
import {
  CreateConversationData,
  UpdateConversationData,
} from '../interfaces/conversation.interface';

@Injectable()
export class ConversationService {
  @InjectModel(Conversation)
  private conversationModel: ReturnModelType<typeof Conversation>;

  createConversation(data: CreateConversationData) {
    const conversation = new this.conversationModel({
      channel: data.channel,
      visitorId: data.visitorId,
    });
    return conversation.save();
  }

  getConversation(id: string) {
    return this.conversationModel.findById(id).exec();
  }

  updateConversation(id: string, data: UpdateConversationData) {
    return this.conversationModel
      .findOneAndUpdate(
        { _id: id },
        {
          $set: {
            evaluation: data.evaluation,
            closedAt: data.closedAt,
          },
        },
        {
          new: true,
        },
      )
      .exec();
  }
}
