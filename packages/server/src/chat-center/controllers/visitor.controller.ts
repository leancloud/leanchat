import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { MessageService } from 'src/message';
import { GetMessagesDto } from '../dtos/message';
import { AuthGuard } from '../guards/auth.guard';

@Controller('visitors')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class VisitorController {
  constructor(private messageService: MessageService) {}

  @Get(':id/messages')
  getVisitorMessages(@Param('id') id: string, @Query() query: GetMessagesDto) {
    return this.messageService.getMessages({ ...query, visitorId: id });
  }
}
