import { Module } from '@nestjs/common';
import { QuickReplyService } from './quick-reply.service';

@Module({
  providers: [QuickReplyService],
  exports: [QuickReplyService],
})
export class QuickReplyModule {}
