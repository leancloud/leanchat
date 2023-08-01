import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClassSerializerInterceptor, Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OperatorController } from './operator/operator.controller';
import { OperatorService } from './operator/operator.service';
import { SessionController } from './session/session.controller';

@Module({
  imports: [],
  controllers: [AppController, OperatorController, SessionController],
  providers: [
    AppService,
    OperatorService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
