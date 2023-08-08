import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { VisitorModule } from 'src/visitor/visitor.module';
import { OperatorModule } from 'src/operator/operator.module';
import { MessageModule } from 'src/message/message.module';
import { ConversationService } from './conversation.service';
import { ChatGateway } from './chat.gateway';
import { AssignVisitorProcessor } from './processors/assign-visitor.processor';
import { CurrentOperatorMiddleware } from './middlewares/current-operator.middleware';
import { OperatorController } from './operator.controller';
import { ConversationController } from './conversation.controller';
import { SessionController } from './session.controller';
import { AssignService } from './assign.service';
import { ChatService } from './chat.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'assign_visitor',
    }),
    VisitorModule,
    OperatorModule,
    MessageModule,
  ],
  providers: [
    ConversationService,
    ChatGateway,
    AssignVisitorProcessor,
    AssignService,
    ChatService,
  ],
  controllers: [OperatorController, SessionController, ConversationController],
  exports: [AssignService],
})
export class ChatCenterModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CurrentOperatorMiddleware)
      .forRoutes('operators', 'conversations');
  }
}
