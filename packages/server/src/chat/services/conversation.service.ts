import { Injectable } from '@nestjs/common';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { Conversation } from '../models/conversation.model';
import { CreateConversationData } from '../interfaces/conversation.interface';

@Injectable()
export class ConversationService {
  @InjectModel(Conversation)
  private conversationModel: ReturnModelType<typeof Conversation>;

  createConversation(data: CreateConversationData) {
    const conversation = new this.conversationModel({
      visitorId: data.visitorId,
    });
    return conversation.save();
  }
}
