import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { VisitorModule } from 'src/visitor/visitor.module';
import { ConversationModule } from 'src/conversation/conversation.module';
import { OperatorModule } from 'src/operator/operator.module';
import { MessageModule } from 'src/message/message.module';
import { ChatbotModule } from 'src/chatbot';
import { CategoryModule } from 'src/category';
import { QuickReplyModule } from 'src/quick-reply';
import { ChatGateway } from './chat.gateway';
import { AssignConversationProcessor } from './processors/assign-conversation.processor';
import { CurrentOperatorMiddleware } from './middlewares/current-operator.middleware';
import {
  AssignService,
  ChatService,
  ChatConversationService,
} from './services';
import {
  CategoryController,
  ChatbotController,
  ConversationController,
  OperatorController,
  QuickReplyController,
  SessionController,
  StatisticsController,
  VisitorController,
} from './controllers';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'assign_conversation',
    }),
    VisitorModule,
    ConversationModule,
    OperatorModule,
    MessageModule,
    ChatbotModule,
    CategoryModule,
    QuickReplyModule,
  ],
  providers: [
    ChatGateway,
    AssignConversationProcessor,
    AssignService,
    ChatService,
    ChatConversationService,
  ],
  controllers: [
    OperatorController,
    SessionController,
    ConversationController,
    VisitorController,
    ChatbotController,
    CategoryController,
    QuickReplyController,
    StatisticsController,
  ],
  exports: [AssignService, ChatConversationService],
})
export class ChatCenterModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CurrentOperatorMiddleware)
      .forRoutes('operators', 'conversations');
  }
}
