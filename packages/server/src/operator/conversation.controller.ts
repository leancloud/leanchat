import {
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Redis } from 'ioredis';

import { AuthGuard } from 'src/auth/auth.guard';
import { VisitorService } from 'src/visitor';
import { MessageService } from 'src/message';
import { REDIS } from 'src/redis';
import { CurrentOperator } from './decorators';
import { Operator } from './operator.entity';

@Controller('conversations')
@UseGuards(AuthGuard)
export class ConversationController {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
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
        return this.visitorService.getVisitors({
          conditions: {},
          orderBy: 'createdAt',
        });
    }
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string) {
    return this.messageService.getMessages({
      visitorId: id,
    });
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
    await this.visitorService.updateVisitor(id, {
      operatorId: operator.id,
      status: 'inProgress',
    });
    await this.redis.hincrby('operator_concurrency', operator.id, 1);
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
    await this.visitorService.updateVisitor(id, {
      operatorId: null,
      status: 'solved',
    });
    await this.redis.hincrby('operator_concurrency', operator.id, -1);
  }
}
