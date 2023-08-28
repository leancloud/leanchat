import { Module } from '@nestjs/common';

import { MessageModule } from 'src/message/message.module';
import { CategoryModule } from 'src/category';
import { ConversationService } from './conversation.service';

@Module({
  imports: [MessageModule, CategoryModule],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
