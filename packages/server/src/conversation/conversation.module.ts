import { Module } from '@nestjs/common';
import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { BullModule } from '@nestjs/bull';

import { MessageModule } from 'src/message/message.module';
import { CategoryModule } from 'src/category';
import { Conversation } from './conversation.model';
import { ConversationStats } from './conversation-stats.model';
import { ConversationService } from './conversation.service';
import { ConversationStatsService } from './conversation-stats.service';
import { CONVERSATION_STATS_QUEUE } from './constants';
import { ConversationStatsProcessor } from './conversation-stats.processor';

@Module({
  imports: [
    TypegooseModule.forFeature([Conversation, ConversationStats]),
    BullModule.registerQueue({
      name: CONVERSATION_STATS_QUEUE,
    }),
    MessageModule,
    CategoryModule,
  ],
  providers: [
    ConversationService,
    ConversationStatsService,
    ConversationStatsProcessor,
  ],
  exports: [ConversationService, ConversationStatsService],
})
export class ConversationModule {}
