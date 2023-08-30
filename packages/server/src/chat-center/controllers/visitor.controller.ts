import { Controller, Get, Param, Query } from '@nestjs/common';

import { MessageService } from 'src/message';
import { GetMessagesDto } from '../dtos/message';

@Controller('visitors')
export class VisitorController {
  constructor(private messageService: MessageService) {}

  @Get(':id/messages')
  getVisitorMessages(@Param('id') id: string, @Query() query: GetMessagesDto) {
    return this.messageService.getMessages({ ...query, visitorId: id });
  }
}
