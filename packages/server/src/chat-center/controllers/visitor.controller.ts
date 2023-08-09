import { Controller, Get, Param } from '@nestjs/common';

import { MessageService } from 'src/message';

@Controller('visitors')
export class VisitorController {
  constructor(private messageService: MessageService) {}

  @Get(':id/messages')
  getVisitorMessages(@Param('id') id: string) {
    return this.messageService.getMessages({ visitorId: id });
  }
}
