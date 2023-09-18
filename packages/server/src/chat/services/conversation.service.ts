import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { Conversation } from '../models';
import { CreateConversationData, UpdateConversationData } from '../interfaces';
import { ConversationCreatedEvent } from '../events';

@Injectable()
export class ConversationService {
  @InjectModel(Conversation)
  private conversationModel: ReturnModelType<typeof Conversation>;

  constructor(private events: EventEmitter2) {}

  async createConversation(data: CreateConversationData) {
    const conversation = new this.conversationModel({
      channel: data.channel,
      visitorId: data.visitorId,
    });
    await conversation.save();

    this.events.emit('conversation.created', {
      conversation,
    } satisfies ConversationCreatedEvent);

    return conversation;
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
