import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { VisitorModule } from 'src/visitor/visitor.module';
import { OperatorModule } from 'src/operator/operator.module';
import { MessageModule } from 'src/message/message.module';
import { ConversationService } from './conversation.service';
import { ChatGateway } from './chat.gateway';
import { AssignVisitorProcessor } from './processors/assign-visitor.processor';
import { ConversationController } from './conversation.controller';
import { OperatorController } from './operator.controller';
import { CurrentOperatorMiddleware } from './middlewares/current-operator.middleware';
import { SessionController } from './session.controller';

@Module({
  imports: [VisitorModule, OperatorModule, MessageModule],
  providers: [ConversationService, ChatGateway, AssignVisitorProcessor],
  controllers: [OperatorController, ConversationController, SessionController],
})
export class ChatCenterModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CurrentOperatorMiddleware)
      .forRoutes('operators', 'conversations');
  }
}
