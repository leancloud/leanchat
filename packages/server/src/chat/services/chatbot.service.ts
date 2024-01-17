import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { AnyKeys } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { InjectRedis, Redis } from 'src/redis';
import { objectId } from 'src/helpers';
import { Chatbot, ChatbotQuestion } from '../models';
import {
  ChatbotConversationContext,
  ChatbotMessageJobData,
  CreateChatbotData,
  UpdateChatbotData,
} from '../interfaces';
import { MessageCreatedEvent } from '../events';
import { ChatbotAcceptRule, UserType } from '../constants';
import { ConversationService } from './conversation.service';
import { ChatService } from './chat.service';

@Injectable()
export class ChatbotService {
  @InjectModel(Chatbot)
  private Chatbot: ReturnModelType<typeof Chatbot>;

  @InjectModel(ChatbotQuestion)
  private ChatbotQuestion: ReturnModelType<typeof ChatbotQuestion>;

  @InjectRedis()
  private redis: Redis;

  constructor(
    @InjectQueue('chatbot_message')
    private messageQueue: Queue<ChatbotMessageJobData>,
    private conversationService: ConversationService,
    private chatService: ChatService,
  ) {}

  async create(data: CreateChatbotData) {
    const chatbot = new this.Chatbot();
    chatbot.name = data.name;
    if (data.acceptRule) {
      chatbot.acceptRule = data.acceptRule;
    }
    chatbot.globalQuestionBaseIds = objectId(data.globalQuestionBaseIds);
    chatbot.initialQuestionBaseIds = objectId(data.initialQuestionBaseIds);
    chatbot.greetingMessage = data.greetingMessage;
    chatbot.noMatchMessage = data.noMatchMessage;
    return chatbot.save();
  }

  update(id: string, data: UpdateChatbotData) {
    const $set: AnyKeys<Chatbot> = {
      name: data.name,
      globalQuestionBaseIds: data.globalQuestionBaseIds,
      initialQuestionBaseIds: data.initialQuestionBaseIds,
      greetingMessage: data.greetingMessage,
      noMatchMessage: data.noMatchMessage,
    };
    const $unset: AnyKeys<Chatbot> = {};
    if (data.acceptRule) {
      $set.acceptRule = data.acceptRule;
    } else if (data.acceptRule === null) {
      $unset.acceptRule = '';
    }
    return this.Chatbot.findByIdAndUpdate(
      id,
      { $set, $unset },
      { new: true },
    ).exec();
  }

  getChatBot(id: string) {
    return this.Chatbot.findById(id).exec();
  }

  getChatbots() {
    return this.Chatbot.find().exec();
  }

  async getContext(
    conversationId: string,
  ): Promise<ChatbotConversationContext> {
    const ctx = await this.redis.get(`bot_ctx:conv:${conversationId}`);
    if (ctx) {
      return JSON.parse(ctx);
    }
    return {};
  }

  async setContext(conversationId: string, data: ChatbotConversationContext) {
    await this.redis.set(
      `bot_ctx:conv:${conversationId}`,
      JSON.stringify(data),
      'EX',
      60 * 10, // 10 mins
    );
  }

  async addProcessMessageJob(data: ChatbotMessageJobData) {
    await this.messageQueue.add(data);
  }

  hasActiveChatbot() {
    return this.Chatbot.findOne({ acceptRule: ChatbotAcceptRule.New }).exec();
  }

  async assignChatbotToConversation(
    conversationId: string,
    acceptRule: ChatbotAcceptRule,
  ) {
    const chatbot = await this.Chatbot.findOne({ acceptRule });
    if (!chatbot) {
      return;
    }
    await this.conversationService.updateConversation(conversationId, {
      chatbotId: chatbot.id,
    });
    await this.chatService.createMessage({
      conversationId,
      from: {
        type: UserType.Chatbot,
        id: chatbot.id,
      },
      data: {
        text: chatbot.greetingMessage.text,
      },
    });
    return chatbot;
  }

  @OnEvent('message.created', { async: true })
  async handleMessage(payload: MessageCreatedEvent) {
    const { conversation, message } = payload;
    if (message.from.type !== UserType.Visitor) {
      return;
    }
    if (!message.isTextMessage()) {
      return;
    }
    if (conversation.operatorId) {
      return;
    }
    if (!conversation.chatbotId) {
      return;
    }
    await this.addProcessMessageJob({
      conversationId: conversation.id,
      chatbotId: conversation.chatbotId.toHexString(),
      message: message.data,
    });
  }
}
