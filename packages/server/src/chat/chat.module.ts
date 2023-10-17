import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import {
  Conversation,
  Message,
  Operator,
  PostprocessingLog,
  Visitor,
} from './models';
import {
  ChatService,
  ConversationService,
  MessageService,
  OperatorService,
  PostprocessingLogService,
  StatsService,
  VisitorService,
} from './services';
import {
  AssignQueuedProcessor,
  AutoAssignProcessor,
  ConversationStatsProcessor,
} from './processors';

@Module({
  imports: [
    TypegooseModule.forFeature([
      Conversation,
      Message,
      Visitor,
      Operator,
      PostprocessingLog,
    ]),
    BullModule.registerQueue(
      {
        name: 'auto_assign_conversation',
      },
      {
        name: 'assign_queued_conversation',
      },
      {
        name: 'conversation_stats',
      },
    ),
  ],
  providers: [
    ConversationService,
    MessageService,
    VisitorService,
    ChatService,
    OperatorService,
    AutoAssignProcessor,
    AssignQueuedProcessor,
    ConversationStatsProcessor,
    StatsService,
    PostprocessingLogService,
  ],
  exports: [
    ChatService,
    ConversationService,
    MessageService,
    VisitorService,
    OperatorService,
    StatsService,
  ],
})
export class ChatModule {}
