import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { Conversation, Message } from '../models';
import { CreateMessageData, GetMessagesOptions } from '../interfaces';
import { MessageCreatedEvent } from '../events';

@Injectable()
export class MessageService {
  @InjectModel(Message)
  private messageModel: ReturnModelType<typeof Message>;

  constructor(private events: EventEmitter2) {}

  async createMessage(conversation: Conversation, data: CreateMessageData) {
    const message = new this.messageModel({
      conversationId: conversation.id,
      visitorId: conversation.visitorId,
      from: data.from,
      type: data.type,
      data: data.data,
    });
    await message.save();
    this.events.emit('message.created', {
      message,
    } satisfies MessageCreatedEvent);
  }

  async getMessages({
    conversationId,
    visitorId,
    type,
    desc,
    limit = 10,
  }: GetMessagesOptions) {
    const query = this.messageModel.find();
    if (conversationId) {
      query.where({ conversationId });
    }
    if (visitorId) {
      query.where({ visitorId });
    }
    if (type) {
      query.where({ type: { $in: type } });
    }
    query.sort({ createdAt: desc ? -1 : 1 });
    query.limit(limit);
    return query.exec();
  }
}
