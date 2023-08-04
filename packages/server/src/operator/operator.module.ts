import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

import { OperatorService } from './operator.service';
import { OperatorController } from './operator.controller';
import { CurrentOperatorMiddleware } from './current-operator.middleware';
import { SessionController } from './session.controller';
import { OperatorGateway } from './operator.gateway';
import { ConversationController } from './conversation.controller';

@Module({
  imports: [
    CacheModule.register({
      max: 100,
      ttl: 60 * 60, // 1 hour
    }),
  ],
  providers: [OperatorService, OperatorGateway],
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
