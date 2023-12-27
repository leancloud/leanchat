import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { OperatorRole } from 'src/chat/constants';
import { Operator } from 'src/chat/models';
import { QuickReplyService } from 'src/quick-reply';
import { AuthGuard } from '../guards/auth.guard';
import {
  CreateQuickReplyDto,
  QuickReplyDto,
  UpdateQuickReplyDto,
} from '../dtos/quick-reply';
import { CurrentOperator } from '../decorators';

@Controller('quick-replies')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class QuickReplyController {
  constructor(private quickReplyService: QuickReplyService) {}

  @Post()
  async createQuickReply(
    @CurrentOperator() operator: Operator,
    @Body() data: CreateQuickReplyDto,
  ) {
    if (operator.role !== OperatorRole.Admin) {
      if (!data.operatorId) {
        throw new ForbiddenException('仅管理员可创建公开快捷回复');
      } else if (data.operatorId !== operator.id) {
        throw new ForbiddenException('仅管理员可为其他客服创建快捷回复');
      }
    }
    const quickReply = await this.quickReplyService.createQuickReply(data);
    return QuickReplyDto.fromDocument(quickReply);
  }

  @Get()
  async getQuickReplies(@CurrentOperator() operator: Operator) {
    const quickReplies =
      await this.quickReplyService.getQuickRepliesForOperator(operator._id);
    return quickReplies.map(QuickReplyDto.fromDocument);
  }

  @Patch(':id')
  async updateQuickReply(
    @Param('id') id: string,
    @Body() data: UpdateQuickReplyDto,
  ) {
    const quickReply = await this.quickReplyService.getQuickReply(id);
    if (!quickReply) {
      throw new NotFoundException(`快捷回复 ${id} 不存在`);
    }
    await this.quickReplyService.updateQuickReply(quickReply, data);
    return QuickReplyDto.fromDocument(quickReply);
  }

  @Delete(':id')
  async deleteQuickReply(@Param('id') id: string) {
    const quickReply = await this.quickReplyService.getQuickReply(id);
    if (!quickReply) {
      throw new NotFoundException(`快捷回复 ${id} 不存在`);
    }
    await this.quickReplyService.deleteQuickReply(quickReply);
  }
}
