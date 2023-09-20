import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { ChatModule } from 'src/chat';
import { CategoryModule } from 'src/category';
import { QuickReplyModule } from 'src/quick-reply';
import { ChatGateway } from './chat.gateway';
import { CurrentOperatorMiddleware } from './middlewares/current-operator.middleware';
import { AutoCloseConversationService } from './services';
import {
  CategoryController,
  ConfigController,
  ConversationController,
  OperatorController,
  QuickReplyController,
  SessionController,
  VisitorController,
} from './controllers';

@Module({
  imports: [ChatModule, CategoryModule, QuickReplyModule],
  providers: [ChatGateway, AutoCloseConversationService],
  controllers: [
    OperatorController,
    SessionController,
    ConversationController,
    VisitorController,
    CategoryController,
    QuickReplyController,
    ConfigController,
  ],
})
export class ChatCenterModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CurrentOperatorMiddleware)
      .forRoutes('operators', 'conversations');
  }
}
