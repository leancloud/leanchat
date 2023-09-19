import { Injectable } from '@nestjs/common';

import { ConversationEvaluation } from '../interfaces/conversation.interface';
import { CreateMessageData } from '../interfaces/chat.interface';
import { ChatError } from '../errors';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';

@Injectable()
export class ChatService {
  constructor(
    private conversationService: ConversationService,
    private messageService: MessageService,
  ) {}

  async createMessage({ conversationId, sender, data }: CreateMessageData) {
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
      conversationId,
      visitorId: conversation.visitorId.toString(),
      sender,
      type: 'message',
      data,
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
      return;
    }

    await this.conversationService.updateConversation(conversationId, {
      closedAt: new Date(),
    });
  }
}
