import { Injectable } from '@nestjs/common';
import _ from 'lodash';

import { Conversation } from 'src/chat/models';
import { MessageService, VisitorService } from 'src/chat/services';
import { ConversationDto } from '../dtos/conversation';
import { MessageDto } from '../dtos/message';
import { VisitorDto } from '../dtos/visitor';

@Injectable()
export class ConversationTransformService {
  constructor(
    private messageService: MessageService,
    private visitorService: VisitorService,
  ) {}

  async composeConversations(conversations: Conversation[]) {
    if (conversations.length === 0) {
      return [];
    }

    const lastMessages = await this.messageService.getLastMessages(
      conversations.map((c) => c.id),
    );
    const lastMessageByCid = _.keyBy(lastMessages, (m) =>
      m.conversationId.toString(),
    );

    const visitors = await this.visitorService.getVisitors(
      conversations.map((c) => c.visitorId),
    );
    const visitorById = _.keyBy(visitors, (v) => v.id as string);

    return conversations.map((conv) => {
      const dto = ConversationDto.fromDocument(conv);
      const lastMessage = lastMessageByCid[conv.id];
      if (lastMessage) {
        dto.lastMessage = MessageDto.fromDocument(lastMessage);
      }
      const visitor = visitorById[conv.visitorId.toString()];
      if (visitor) {
        dto.visitor = VisitorDto.fromDocument(visitor);
      }
      return dto;
    });
  }

  async composeConversation(conversation: Conversation) {
    const dto = ConversationDto.fromDocument(conversation);
    const lastMessage = await this.messageService.getLastMessage(
      conversation.id,
    );
    if (lastMessage) {
      dto.lastMessage = MessageDto.fromDocument(lastMessage);
    }
    const visitor = await this.visitorService.getVisitor(
      conversation.visitorId,
    );
    if (visitor) {
      dto.visitor = VisitorDto.fromDocument(visitor);
    }
    return dto;
  }
}
