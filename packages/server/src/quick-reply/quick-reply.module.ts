import { Module } from '@nestjs/common';
import { TypegooseModule } from '@m8a/nestjs-typegoose';

import { QuickReply } from './quick-reply.model';
import { QuickReplyService } from './quick-reply.service';

@Module({
  imports: [TypegooseModule.forFeature([QuickReply])],
  providers: [QuickReplyService],
  exports: [QuickReplyService],
})
export class QuickReplyModule {}
