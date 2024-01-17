import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import {
  Chatbot,
  ChatbotQuestion,
  ChatbotQuestionBase,
  Conversation,
  Message,
  Operator,
  PostprocessingLog,
  Visitor,
} from './models';
import {
  ChatService,
  ChatbotQuestionService,
  ChatbotService,
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
  ChatbotMessageProcessor,
  ConversationStatsProcessor,
} from './processors';

@Module({
  imports: [
    TypegooseModule.forFeature([
      Chatbot,
      ChatbotQuestion,
      ChatbotQuestionBase,
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
      {
        name: 'chatbot_message',
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
    ChatbotService,
    ChatbotQuestionService,
    ChatbotMessageProcessor,
  ],
  exports: [
    ChatService,
    ChatbotService,
    ChatbotQuestionService,
    ConversationService,
    MessageService,
    VisitorService,
    OperatorService,
    StatsService,
  ],
})
export class ChatModule {}
