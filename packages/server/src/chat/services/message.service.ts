import { InjectModel } from '@m8a/nestjs-typegoose';
import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';

import { Message } from '../models/message.model';
import { CreateMessageData } from '../interfaces/message.interface';

@Injectable()
export class MessageService {
  @InjectModel(Message)
  private messageModel: ReturnModelType<typeof Message>;

  createMessage(data: CreateMessageData) {
    const message = new this.messageModel({
      visitorId: data.visitorId,
      conversationId: data.conversationId,
      from: data.from,
      type: data.type,
      data: data.data,
    });
    return message.save();
  }
}
