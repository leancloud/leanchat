import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { AnyKeys } from 'mongoose';
import _ from 'lodash';

import { Conversation } from '../models';
import {
  CreateConversationData,
  GetConversationOptions,
  GetInactiveConversationIdsOptions,
  UpdateConversationData,
} from '../interfaces';
import { ConversationCreatedEvent, ConversationUpdatedEvent } from '../events';
import { OperatorService } from './operator.service';
import { ChatError } from '../errors';

@Injectable()
export class ConversationService {
  @InjectModel(Conversation)
  private conversationModel: ReturnModelType<typeof Conversation>;

  constructor(
    private events: EventEmitter2,
    private operatorService: OperatorService,
  ) {}

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

  getConversations({
    operatorId,
    status,
    desc,
    limit = 10,
  }: GetConversationOptions) {
    const query = this.conversationModel.find();
    if (operatorId !== undefined) {
      if (operatorId === null) {
        query.where({ operatorId: { $exists: false } });
      } else {
        query.where({ operatorId });
      }
    }
    if (status) {
      query.where({ closedAt: { $exists: status === 'closed' } });
    }
    query.sort({ createdAt: desc ? 1 : -1 });
    query.limit(limit);
    return query.exec();
  }

  async getInactiveConversationIds({
    lastActivityBefore,
    limit,
  }: GetInactiveConversationIdsOptions) {
    const results = await this.conversationModel
      .aggregate([
        {
          $match: {
            closedAt: { $exists: false },
            $expr: {
              $gte: ['$operatorLastActivityAt', '$visitorLastActivityAt'],
            },
            visitorLastActivityAt: {
              $lte: lastActivityBefore,
            },
          },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            _id: 1,
          },
        },
      ])
      .exec();

    return results.map((result) => result._id.toString()) as string[];
  }

  async updateConversation(id: string, data: UpdateConversationData) {
    data = _.omitBy(data, _.isUndefined);
    if (_.isEmpty(data)) {
      return;
    }

    if (data.operatorId) {
      const operator = await this.operatorService.getOperator(data.operatorId);
      if (!operator) {
        throw new ChatError('OPERATOR_NOT_EXIST');
      }
    }

    const $set: AnyKeys<Conversation> = {
      operatorId: data.operatorId,
      categoryId: data.categoryId,
      evaluation: data.evaluation,
      closedAt: data.closedAt,
      queuedAt: data.queuedAt,
      visitorLastActivityAt: data.visitorLastActivityAt,
      operatorLastActivityAt: data.operatorLastActivityAt,
    };

    const $unset: AnyKeys<Conversation> = {};

    if (data.visitorWaitingSince) {
      $set.visitorWaitingSince = data.visitorWaitingSince;
    } else if (data.visitorWaitingSince === null) {
      $unset.visitorWaitingSince = '';
    }

    const conversation = await this.conversationModel
      .findOneAndUpdate({ _id: id }, { $set, $unset }, { new: true })
      .exec();

    if (conversation) {
      this.events.emit('conversation.updated', {
        conversation,
        data,
      } satisfies ConversationUpdatedEvent);
    }

    return conversation;
  }

  getOpenConversationCount(operatorId: string) {
    return this.conversationModel
      .count({
        operatorId,
        closedAt: {
          $exists: false,
        },
      })
      .exec();
  }
}
