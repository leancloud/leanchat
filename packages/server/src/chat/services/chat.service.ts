import { Injectable } from '@nestjs/common';

import { StartConversationData } from '../interfaces/chat.interface';
import { ConversationEvaluation } from '../interfaces/conversation.interface';
import { MessageData } from '../interfaces/message.interface';
import { ChatError } from '../errors';
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
    await this.createVisitorMessage(conversation.id, data.data);
    return conversation;
  }

  async createVisitorMessage(conversationId: string, data: MessageData) {
    const conversation = await this.conversationService.getConversation(
      conversationId,
    );
    if (!conversation) {
      throw new ChatError('CONVERSATION_NOT_EXIST');
    }
    if (conversation.closedAt) {
      throw new ChatError('CONVERSATION_CLOSED');
    }

    return this.messageService.createMessage({
      conversationId: conversation.id,
      visitorId: conversation.visitorId.toString(),
      from: {
        type: 'visitor',
        id: conversation.visitorId.toString(),
      },
      type: 'message',
      data: data,
    });
  }

  async evaluateConversation(
    conversationId: string,
    evaluation: ConversationEvaluation,
  ) {
    const conversation = await this.conversationService.getConversation(
      conversationId,
    );
    if (!conversation) {
      throw new ChatError('CONVERSATION_NOT_EXIST');
    }
    if (conversation.evaluation) {
      throw new ChatError('CONVERSATION_EVALUATED');
    }

    await this.conversationService.updateConversation(conversationId, {
      evaluation,
    });
    await this.messageService.createMessage({
      conversationId: conversation.id,
      visitorId: conversation.visitorId.toString(),
      type: 'evaluate',
      data: { evaluation },
    });
  }

  async closeConversation(conversationId: string) {
    const conversation = await this.conversationService.getConversation(
      conversationId,
    );
    if (!conversation) {
      throw new ChatError('CONVERSATION_NOT_EXIST');
    }
    if (conversation.closedAt) {
      throw new ChatError('CONVERSATION_CLOSED');
    }

    await this.conversationService.updateConversation(conversationId, {
      closedAt: new Date(),
    });
  }
}
