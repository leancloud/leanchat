import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { Types } from 'mongoose';

import { ConversationCreatedEvent } from 'src/event';
import { MessageService } from 'src/message';
import { CategoryService } from 'src/category';
import { Conversation, ConversationDocument } from './conversation.model';
import {
  CreateConversationData,
  EvaluateConversationData,
  GetConversationOptions,
  UpdateConversationData,
} from './interfaces';
import { ConversationStatus } from './constants';

@Injectable()
export class ConversationService {
  @InjectModel(Conversation)
  private conversationModel: ReturnModelType<typeof Conversation>;

  constructor(
    private events: EventEmitter2,
    private messageService: MessageService,
    private categoryService: CategoryService,
  ) {}

  async createConversation(data: CreateConversationData) {
    const conversation = new this.conversationModel({
      channel: data.channel,
      visitorId: data.visitorId,
      status: ConversationStatus.New,
    });
    await conversation.save();

    this.events.emit('conversation.created', {
      conversation,
    } satisfies ConversationCreatedEvent);

    return conversation;
  }

  getConversation(id: string | Types.ObjectId) {
    return this.conversationModel.findById(id).exec();
  }

  async updateConversation(
    conv: ConversationDocument,
    data: UpdateConversationData,
  ) {
    if (data.operatorId) {
      conv.set('operatorId', data.operatorId);
    }
    if (data.status) {
      conv.status = data.status;
    }
    if (data.queuedAt) {
      conv.queuedAt = data.queuedAt;
    }
    if (data.lastMessage) {
      conv.lastMessage = data.lastMessage;
    }
    if (data.visitorLastActivityAt) {
      conv.visitorLastActivityAt = data.visitorLastActivityAt;
    }
    if (data.evaluation) {
      conv.evaluation = data.evaluation;
    }
    if (data.categoryId) {
      const category = await this.categoryService.getCategory(data.categoryId);
      if (!category) {
        throw new BadRequestException(`分类 ${data.categoryId} 不存在`);
      }
      conv.categoryId = category._id;
    }
    return conv.save();
  }

  async getConversations({
    status,
    visitorId,
    operatorId,
    sort = 'createdAt',
    desc = false,
    limit,
    cursor,
  }: GetConversationOptions) {
    const query = this.conversationModel.find();
    if (status) {
      query.where({ status });
    }
    if (visitorId) {
      query.where({ visitorId });
    }
    if (operatorId) {
      query.where({ operatorId });
    }
    if (operatorId === null) {
      query.where('operatorId').exists(false);
    }

    query.sort({ [sort]: desc ? -1 : 1 });

    if (limit) {
      query.limit(limit);
    }
    if (cursor) {
      if (desc) {
        query.lt(sort, cursor);
      } else {
        query.gt(sort, cursor);
      }
    }

    return query.exec();
  }

  getAssignedConversationCount(operatorId: string) {
    return this.conversationModel.count({
      operator: operatorId,
      status: ConversationStatus.InProgress,
    });
  }

  async evaluateConversation(
    conv: ConversationDocument,
    evaluation: EvaluateConversationData,
  ) {
    await this.updateConversation(conv, {
      evaluation,
    });
    await this.messageService.createMessage({
      visitorId: conv.visitorId,
      conversationId: conv.id,
      type: 'log',
      from: {
        type: 'system',
      },
      data: {
        type: 'evaluated',
      },
    });
  }
}
