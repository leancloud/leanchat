import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { Message } from '../models/message.model';
import {
  CreateMessageData,
  GetMessagesOptions,
} from '../interfaces/message.interface';
import { MessageCreatedEvent } from '../events';

@Injectable()
export class MessageService {
  @InjectModel(Message)
  private messageModel: ReturnModelType<typeof Message>;

  constructor(private events: EventEmitter2) {}

  async createMessage(data: CreateMessageData) {
    const message = new this.messageModel({
      visitorId: data.visitorId,
      conversationId: data.conversationId,
      sender: data.sender,
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
