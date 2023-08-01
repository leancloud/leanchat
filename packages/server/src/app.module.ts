import { APP_INTERCEPTOR } from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SessionController } from './session/session.controller';
import { RedisModule } from './redis/redis.module';
import { OperatorModule } from './operator/operator.module';
import { CurrentOperatorMiddleware } from './common/middlewares/current-operator.middleware';

@Module({
  imports: [RedisModule, OperatorModule],
  controllers: [AppController, SessionController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CurrentOperatorMiddleware).forRoutes('/');
  }
}
