import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { Types } from 'mongoose';

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

    return message;
  }

  async getMessages({
    conversationId,
    visitorId,
    type,
    desc,
    limit = 10,
    cursor,
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
    if (cursor) {
      query.where({
        createdAt: desc ? { $lt: cursor } : { $gt: cursor },
      });
    }
    query.sort({ createdAt: desc ? -1 : 1 });
    query.limit(limit);
    return query.exec();
  }

  getLastMessage(conversationId: string) {
    return this.messageModel
      .findOne({
        conversationId,
        type: 'message',
        'from.type': { $in: ['operator', 'visitor'] },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getLastMessages(conversationIds: string[]) {
    const result = await this.messageModel
      .aggregate([
        {
          $match: {
            conversationId: {
              $in: conversationIds.map((id) => new Types.ObjectId(id)),
            },
            type: 'message',
            'from.type': { $in: ['operator', 'visitor'] },
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $group: {
            _id: '$conversationId',
            lastMessage: {
              $first: '$$ROOT',
            },
          },
        },
      ])
      .exec();
    return result.map(({ lastMessage }) => {
      const message = new this.messageModel(lastMessage);
      message.id = message._id.toString();
      return message;
    });
  }
}
