import { Injectable } from '@nestjs/common';

import {
  CreateVisitorMessageData,
  StartConversationData,
} from '../interfaces/chat.interface';
import { ConversationEvaluation } from '../interfaces/conversation.interface';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';

@Injectable()
export class ChatService {
  constructor(
    private conversationService: ConversationService,
    private messageService: MessageService,
  ) {}

  async startConversation(data: StartConversationData) {
    const conversation = await this.conversationService.createConversation({
      visitorId: data.visitorId,
    });
    await this.createVisitorMessage({
      conversationId: conversation.id,
      visitorId: data.visitorId,
      data: data.data,
    });
    return conversation;
  }

  createVisitorMessage(data: CreateVisitorMessageData) {
    return this.messageService.createMessage({
      conversationId: data.conversationId,
      visitorId: data.visitorId,
      from: {
        type: 'visitor',
        id: data.visitorId,
      },
      type: 'message',
      data: data.data,
    });
  }

  async evaluateConversation(
    conversationId: string,
    evaluation: ConversationEvaluation,
  ) {
    const conversation = await this.conversationService.updateConversation(
      conversationId,
      {
        evaluation,
      },
    );
    if (conversation) {
      await this.messageService.createMessage({
        conversationId: conversation.id,
        visitorId: conversation.visitorId.toString(),
        type: 'evaluate',
        data: { evaluation },
      });
    }
    return conversation;
  }

  closeConversation(conversationId: string) {
    return this.conversationService.updateConversation(conversationId, {
      closedAt: new Date(),
    });
  }
}
