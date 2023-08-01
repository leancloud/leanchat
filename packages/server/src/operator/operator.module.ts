import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

import { OperatorService } from './operator.service';
import { OperatorController } from './operator.controller';
import { CurrentOperatorMiddleware } from './current-operator.middleware';

@Module({
  imports: [
    CacheModule.register({
      max: 100,
      ttl: 60 * 60, // 1 hour
    }),
  ],
  providers: [OperatorService],
  controllers: [OperatorController],
  exports: [OperatorService],
})
export class OperatorModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CurrentOperatorMiddleware).forRoutes(OperatorController);
  }
}
