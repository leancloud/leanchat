import path from 'node:path';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { OperatorModule } from './operator/operator.module';
import { VisitorModule } from './visitor/visitor.module';
import { MessageModule } from './message/message.module';
import { ChatCenterModule } from './chat-center/chat-center.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, 'public'),
    }),
    EventEmitterModule.forRoot(),
    BullModule.forRoot({
      prefix: 'chat:queue',
      redis: process.env.REDIS_URL_QUEUE,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
    RedisModule,
    OperatorModule,
    VisitorModule,
    MessageModule,
    ChatCenterModule,
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
