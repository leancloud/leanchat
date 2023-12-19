import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import _ from 'lodash';

import { Operator } from 'src/chat/models';
import { ChatService, ConversationService } from 'src/chat/services';
import { UserType } from 'src/chat/constants';
import { AuthGuard } from '../guards';
import { ListConversationDto } from '../dtos/conversation';
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
  async conversation_search(@Body() body: SearchConversationDto) {
    if (_.isEmpty(body.id) && !body.from && !body.to) {
      // avoid full collection scan
      throw new BadRequestException('缺少必要的筛选条件');
    }

    const { page = 1, pageSize = 10, ...options } = body;
    const result = await this.conversationService.searchConversations({
      ...options,
      skip: (page - 1) * pageSize,
      limit: pageSize,
    });
    return {
      data: result.data.map((item) => ({
        ...item,
        visitor: item.visitor && VisitorDto.fromDocument(item.visitor),
        lastMessage:
          item.lastMessage && MessageDto.fromDocument(item.lastMessage),
      })),
      totalCount: result.totalCount,
    };
  }
}
