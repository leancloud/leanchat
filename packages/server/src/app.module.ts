import path from 'node:path';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { OperatorModule } from './operator/operator.module';
import { VisitorModule } from './visitor/visitor.module';
import { MessageModule } from './message/message.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, 'public'),
    }),
    EventEmitterModule.forRoot(),
    RedisModule,
    OperatorModule,
    VisitorModule,
    MessageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
