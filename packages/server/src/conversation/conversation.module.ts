import { Module } from '@nestjs/common';
import { TypegooseModule } from '@m8a/nestjs-typegoose';

import { MessageModule } from 'src/message/message.module';
import { CategoryModule } from 'src/category';
import { Conversation } from './conversation.model';
import { ConversationService } from './conversation.service';

@Module({
  imports: [
    TypegooseModule.forFeature([Conversation]),
    MessageModule,
    CategoryModule,
  ],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
