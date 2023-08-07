import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

import { VisitorModule } from 'src/visitor/visitor.module';
import { MessageModule } from 'src/message/message.module';
import { OperatorService } from './operator.service';
import { OperatorController } from './operator.controller';
import { CurrentOperatorMiddleware } from './current-operator.middleware';
import { SessionController } from './session.controller';
import { OperatorGateway } from './operator.gateway';
import { ConversationController } from './conversation.controller';
import { OnlineOperatorsService } from './online-operators.service';

@Module({
  imports: [
    CacheModule.register({
      max: 100,
      ttl: 60 * 60, // 1 hour
    }),
    VisitorModule,
    MessageModule,
  ],
  providers: [OperatorService, OperatorGateway, OnlineOperatorsService],
  controllers: [OperatorController, SessionController, ConversationController],
  exports: [OperatorService],
})
export class OperatorModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CurrentOperatorMiddleware)
      .forRoutes('operators', 'conversations');
  }
}
