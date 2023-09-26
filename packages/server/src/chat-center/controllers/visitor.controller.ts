import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { MessageService, Visitor, VisitorService } from 'src/chat';
import { GetMessagesDto, MessageDto } from '../dtos/message';
import { AuthGuard } from '../guards/auth.guard';
import { FindVisitorPipe } from '../pipes/find-visitor.pipe';
import { UpdateVisitorDto, VisitorDto } from '../dtos/visitor';

@Controller('visitors')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class VisitorController {
  constructor(
    private visitorService: VisitorService,
    private messageService: MessageService,
  ) {}

  @Get(':id')
  getVisitor(@Param('id', FindVisitorPipe) visitor: Visitor) {
    return VisitorDto.fromDocument(visitor);
  }

  @Patch(':id')
  async updateVisitor(
    @Param('id', FindVisitorPipe) visitor: Visitor,
    @Body() data: UpdateVisitorDto,
  ) {
    const updated = await this.visitorService.updateVisitor(visitor.id, data);
    return VisitorDto.fromDocument(updated!);
  }

  @Get(':id/messages')
  async getVisitorMessages(
    @Param('id') id: string,
    @Query() query: GetMessagesDto,
  ) {
    const messages = await this.messageService.getMessages({
      ...query,
      visitorId: id,
    });
    return messages.map(MessageDto.fromDocument);
  }
}
