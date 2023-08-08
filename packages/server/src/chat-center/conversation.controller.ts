import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Operator } from 'src/operator';
import { VisitorService } from 'src/visitor';
import { MessageService } from 'src/message';
import { AuthGuard } from './guards/auth.guard';
import { ConversationService } from './conversation.service';
import { CurrentOperator } from './decorators/current-operator.decorator';

@Controller('conversations')
@UseGuards(AuthGuard)
export class ConversationController {
  constructor(
    private conversationService: ConversationService,
    private visitorService: VisitorService,
    private messageService: MessageService,
  ) {}

  @Get()
  getConversations(
    @CurrentOperator() operator: Operator,
    @Query('type') type: string | undefined,
  ) {
    switch (type) {
      case 'unassigned':
        return this.visitorService.getVisitors({
          conditions: {
            status: 'queued',
          },
          orderBy: 'queuedAt',
        });
      case 'myOpen':
        return this.visitorService.getVisitors({
          conditions: {
            operatorId: operator.id,
          },
          orderBy: 'createdAt',
        });
      case 'solved':
        return this.visitorService.getVisitors({
          conditions: {
            status: 'solved',
          },
          orderBy: 'createdAt',
        });
      default:
        throw new BadRequestException('Invalid conversation type');
    }
  }

  @Get(':id/messages')
  getConversationMessages(@Param('id') id: string) {
    return this.messageService.getMessages({ visitorId: id });
  }

  @Post(':id/join')
  async joinConversation(
    @CurrentOperator() operator: Operator,
    @Param('id') id: string,
  ) {
    const visitor = await this.visitorService.getVisitor(id);
    if (!visitor) {
      throw new NotFoundException(`会话 ${id} 不存在`);
    }
    if (visitor.operatorId) {
      throw new ForbiddenException(`会话 ${id} 已被分配`);
    }
    await this.conversationService.assignOperator(visitor, operator);
  }

  @Post(':id/close')
  async closeConversation(
    @CurrentOperator() operator: Operator,
    @Param('id') id: string,
  ) {
    const visitor = await this.visitorService.getVisitor(id);
    if (!visitor) {
      throw new NotFoundException(`会话 ${id} 不存在`);
    }
    if (visitor.operatorId !== operator.id) {
      throw new ForbiddenException(`会话 ${id} 不属于您`);
    }
    await this.conversationService.closeConversation(visitor);
  }
}
