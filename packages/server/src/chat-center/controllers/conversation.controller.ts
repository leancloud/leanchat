import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import _ from 'lodash';

import {
  ChatService,
  Conversation,
  ConversationService,
  MessageService,
  Operator,
} from 'src/chat';
import { AuthGuard } from '../guards/auth.guard';
import { GetConversationsDto } from '../dtos/conversation/get-conversations.dto';
import { GetMessagesDto, MessageDto } from '../dtos/message';
import { ConversationDto, UpdateConversationDto } from '../dtos/conversation';
import { CurrentOperator } from '../decorators/current-operator.decorator';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FindConversationPipe } from '../pipes';
import { InviteEvaluationEvent } from 'src/event';

@Controller('conversations')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class ConversationController {
  constructor(
    private events: EventEmitter2,
    private conversationService: ConversationService,
    private messageService: MessageService,
    private chatService: ChatService,
  ) {}

  @Get()
  async getConversations(@Query() query: GetConversationsDto) {
    const conversations = await this.conversationService.getConversations(
      query,
    );
    const lastMessages = await this.messageService.getLastMessages(
      conversations.map((c) => c.id),
    );
    const lastMessageByCid = _.keyBy(lastMessages, (m) =>
      m.conversationId.toString(),
    );
    return conversations.map((conversation) => {
      const dto = ConversationDto.fromDocument(conversation);
      const lastMessage = lastMessageByCid[conversation.id];
      if (lastMessage) {
        dto.lastMessage = MessageDto.fromDocument(lastMessage);
      }
      return dto;
    });
  }

  @Get(':id')
  async getConversation(@Param('id') id: string) {
    const conversation = await this.conversationService.getConversation(id);
    if (!conversation) {
      throw new NotFoundException(`会话 ${id} 不存在`);
    }
    return ConversationDto.fromDocument(conversation);
  }

  @Get(':id/messages')
  async getConversationMessages(
    @Param('id') id: string,
    @Query() query: GetMessagesDto,
  ) {
    const messages = await this.messageService.getMessages({
      ...query,
      conversationId: id,
    });
    return messages.map(MessageDto.fromDocument);
  }

  @Patch(':id')
  async updateConversation(
    @Param('id') id: string,
    @Body() data: UpdateConversationDto,
  ) {
    const conversation = await this.conversationService.getConversation(id);
    if (!conversation) {
      throw new NotFoundException(`会话 ${id} 不存在`);
    }
    await this.conversationService.updateConversation(id, data);
  }

  @Post(':id/close')
  async closeConversation(
    @Param('id') id: string,
    @CurrentOperator() operator: Operator,
  ) {
    await this.chatService.closeConversation(id, {
      type: 'operator',
      id: operator.id,
    });
  }

  @Post(':id/inviteEvaluation')
  inviteEvaluation(
    @Param('id', FindConversationPipe) conversation: Conversation,
  ) {
    if (conversation.evaluation) {
      return;
    }
    this.events.emit('inviteEvaluation', {
      conversation,
    } satisfies InviteEvaluationEvent);
  }
}
