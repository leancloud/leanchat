import {
  Body,
  Controller,
  Post,
  UseFilters,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { MongoServerErrorFilter } from 'src/common/filters';
import { Operator } from 'src/chat/models';
import { ChatService, ConversationService } from 'src/chat/services';
import { UserType } from 'src/chat/constants';
import { AuthGuard } from '../guards';
import { ConversationDto, ListConversationDto } from '../dtos/conversation';
import { ConversationTransformService } from '../services';
import {
  ReopenConversationDto,
  SearchConversationDto,
} from '../dtos/conversation';
import { CurrentOperator } from '../decorators';
import { VisitorDto } from '../dtos/visitor';
import { MessageDto } from '../dtos/message';

@Controller()
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class APIController {
  constructor(
    private conversationService: ConversationService,
    private conversationDtoService: ConversationTransformService,
    private chatService: ChatService,
  ) {}

  @Post('conversation.list')
  async conversation_list(@Body() body: ListConversationDto) {
    const {
      status,
      operatorId,
      desc,
      before,
      after,
      page = 1,
      pageSize = 10,
    } = body;
    const conversations = await this.conversationService.getConversations({
      status,
      operatorId,
      desc,
      before,
      after,
      skip: before || after ? undefined : (page - 1) * pageSize,
      limit: pageSize,
    });
    return this.conversationDtoService.composeConversations(conversations);
  }

  @Post('conversation.reopen')
  async conversation_reopen(
    @CurrentOperator() operator: Operator,
    @Body() body: ReopenConversationDto,
  ) {
    await this.chatService.reopenConversation({
      conversationId: body.conversationId,
      by: {
        type: UserType.Operator,
        id: operator.id,
      },
    });
  }

  @Post('conversation.search')
  @UseFilters(MongoServerErrorFilter)
  async conversation_search(@Body() body: SearchConversationDto) {
    const { page = 1, pageSize = 10, ...options } = body;
    const result = await this.conversationService.searchConversations({
      ...options,
      skip: (page - 1) * pageSize,
      limit: pageSize,
    });

    const data = result.data.map((doc) => {
      const dto = ConversationDto.fromDocument(doc);
      if (doc.visitor) {
        dto.visitor = VisitorDto.fromDocument(doc.visitor);
      }
      if (doc.lastMessage) {
        dto.lastMessage = MessageDto.fromDocument(doc.lastMessage);
      }
      dto.joinedOperatorIds = doc.joinedOperatorIds?.map((id) =>
        id.toHexString(),
      );
      return dto;
    });

    return {
      data,
      totalCount: result.totalCount,
    };
  }
}
