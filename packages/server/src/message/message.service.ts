import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { MessageCreatedEvent } from 'src/event';
import { Message } from './message.model';
import { CreateMessageData, IGetMessagesDto } from './interfaces';

@Injectable()
export class MessageService {
  @InjectModel(Message)
  private messageModel: ReturnModelType<typeof Message>;

  constructor(private events: EventEmitter2) {}

  async createMessage(data: CreateMessageData) {
    const message = new this.messageModel({
      visitorId: data.visitorId,
      conversationId: data.conversationId,
      type: data.type,
      from: data.from,
      data: data.data,
    });
    await message.save();

    this.events.emit('message.created', {
      message,
    } satisfies MessageCreatedEvent);

    return message;
  }

  async getMessages({
    visitorId,
    conversationId,
    type,
    limit,
    desc,
    cursor,
  }: IGetMessagesDto) {
    const query = this.messageModel.find();
    if (visitorId) {
      query.where({ visitorId });
    }
    if (conversationId) {
      query.where({ conversationId });
    }
    if (type) {
      if (Array.isArray(type)) {
        query.in('type', type);
      } else {
        query.where({ type });
      }
    }
    if (limit) {
      query.limit(limit);
    }

    query.sort({ createdAt: desc ? -1 : 1 });

    if (cursor) {
      if (desc) {
        query.lt('createdAt', cursor);
      } else {
        query.gt('createdAt', cursor);
      }
    }

    return query.exec();
  }
}
