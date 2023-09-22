import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypegooseModule } from '@m8a/nestjs-typegoose';

import { ChatModule } from 'src/chat';
import { CategoryModule } from 'src/category';
import { QuickReplyModule } from 'src/quick-reply';
import { OnlineTime } from './models/online-time.model';
import { ChatGateway } from './chat.gateway';
import { CurrentOperatorMiddleware } from './middlewares/current-operator.middleware';
import { AutoCloseConversationService, OnlineTimeService } from './services';
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
  imports: [
    TypegooseModule.forFeature([OnlineTime]),
    ChatModule,
    CategoryModule,
    QuickReplyModule,
  ],
  providers: [ChatGateway, AutoCloseConversationService, OnlineTimeService],
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
