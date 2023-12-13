import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ZodValidationPipe } from 'nestjs-zod';

import { InviteEvaluationEvent } from 'src/event';
import {
  ChatService,
  Conversation,
  ConversationService,
  MessageService,
  Operator,
  OperatorService,
  UserType,
} from 'src/chat';
import { AuthGuard } from '../guards/auth.guard';
import { GetMessagesDto, MessageDto } from '../dtos/message';
import {
  AssignConversationDto,
  UpdateConversationDto,
} from '../dtos/conversation';
import { CurrentOperator } from '../decorators/current-operator.decorator';
import { FindConversationPipe } from '../pipes';
import { ConversationTransformService } from '../services/conversation-transform.service';

@Controller('conversations')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class ConversationController {
  constructor(
    private events: EventEmitter2,
    private conversationService: ConversationService,
    private messageService: MessageService,
    private chatService: ChatService,
    private operatorService: OperatorService,
    private convTransformService: ConversationTransformService,
  ) {}

  @Get(':id')
  getConversation(@Param('id', FindConversationPipe) conv: Conversation) {
    return this.convTransformService.composeConversation(conv);
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
    @Param('id', FindConversationPipe) conv: Conversation,
    @Body() data: UpdateConversationDto,
  ) {
    await this.conversationService.updateConversation(conv.id, data);
  }

  @Post(':id/close')
  async closeConversation(
    @Param('id') id: string,
    @CurrentOperator() operator: Operator,
  ) {
    await this.chatService.closeConversation({
      conversationId: id,
      by: {
        type: UserType.Operator,
        id: operator.id,
      },
    });
  }

  @Post(':id/inviteEvaluation')
  async inviteEvaluation(
    @Param('id', FindConversationPipe) conversation: Conversation,
  ) {
    await this.conversationService.updateConversation(conversation.id, {
      evaluationInvitedAt: new Date(),
    });
    this.events.emit('inviteEvaluation', {
      conversation,
    } satisfies InviteEvaluationEvent);
  }

  @Post(':id/assign')
  async assignConversation(
    @Param('id', FindConversationPipe) conversation: Conversation,
    @Body() data: AssignConversationDto,
    @CurrentOperator() currentOperator: Operator,
  ) {
    const operator = await this.operatorService.getOperator(data.operatorId);
    if (!operator) {
      throw new BadRequestException('Invalid operator id');
    }
    await this.chatService.assignConversation(conversation, operator, {
      type: UserType.Operator,
      id: currentOperator.id,
    });
  }
}
