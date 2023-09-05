import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { ConversationCreatedEvent } from 'src/event';
import { MessageService } from 'src/message';
import { CategoryService } from 'src/category';
import { Conversation, ConversationDocument } from './conversation.model';
import {
  EvaluateConversationData,
  GetConversationOptions,
  UpdateConversationData,
} from './interfaces';

@Injectable()
export class ConversationService {
  @InjectModel(Conversation)
  private conversationModel: ReturnModelType<typeof Conversation>;

  constructor(
    private events: EventEmitter2,
    private messageService: MessageService,
    private categoryService: CategoryService,
  ) {}

  async createConversation(visitorId: string) {
    const conversation = new this.conversationModel({
      visitor: visitorId,
      status: 'new',
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

  async updateConversation(
    conv: ConversationDocument,
    data: UpdateConversationData,
  ) {
    if (data.operatorId) {
      conv.set('operator', data.operatorId);
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
      conv.category = category._id;
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
      query.where('status').equals(status);
    }
    if (visitorId) {
      query.where('visitor').equals(visitorId);
    }
    if (operatorId) {
      query.where('operator').equals(operatorId);
    }
    if (operatorId === null) {
      query.where('operator').exists(false);
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
      status: 'inProgress',
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
      visitorId: conv.visitor._id.toString(),
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
