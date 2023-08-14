import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { VisitorModule } from 'src/visitor/visitor.module';
import { ConversationService } from 'src/conversation';
import { ConversationModule } from 'src/conversation/conversation.module';
import { OperatorModule } from 'src/operator/operator.module';
import { MessageModule } from 'src/message/message.module';
import { ChatGateway } from './chat.gateway';
import { AssignConversationProcessor } from './processors/assign-conversation.processor';
import { CurrentOperatorMiddleware } from './middlewares/current-operator.middleware';
import { AssignService } from './assign.service';
import { ChatService } from './chat.service';
import { ChatConversationService } from './services/chat-conversation.service';
import {
  ConversationController,
  OperatorController,
  SessionController,
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
  ],
  providers: [
    ConversationService,
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
  ],
  exports: [AssignService],
})
export class ChatCenterModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CurrentOperatorMiddleware)
      .forRoutes('operators', 'conversations');
  }
}
