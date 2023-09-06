import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { QuickReplyService } from 'src/quick-reply';
import { AuthGuard } from '../guards/auth.guard';
import {
  CreateQuickReplyDto,
  QuickReplyDto,
  UpdateQuickReplyDto,
} from '../dtos/quick-reply';

@Controller('quick-replies')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class QuickReplyController {
  constructor(private quickReplyService: QuickReplyService) {}

  @Post()
  async createQuickReply(@Body() data: CreateQuickReplyDto) {
    const quickReply = await this.quickReplyService.createQuickReply(data);
    return QuickReplyDto.fromDocument(quickReply);
  }

  @Get()
  async getQuickReplies() {
    const quickReplies = await this.quickReplyService.getQuickReplies();
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
