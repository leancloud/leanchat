import { Module } from '@nestjs/common';

import { MessageModule } from 'src/message/message.module';
import { ConversationService } from './conversation.service';

@Module({
  imports: [MessageModule],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
