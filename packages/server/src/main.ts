import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import AV from 'leancloud-storage';
import 'dotenv/config';

import { AppModule } from './app.module';
import { REDIS } from './redis/constants';

AV.init({
  appId: process.env.LEANCLOUD_APP_ID!,
  appKey: process.env.LEANCLOUD_APP_KEY!,
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY,
  serverURL: process.env.LEANCLOUD_API_SERVER,
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.disable('x-powered-by');
  app.setGlobalPrefix('api');
  app.use(
    session({
      store: new RedisStore({
        client: app.get(REDIS),
        prefix: 'chat_session:',
      }),
      name: 'sid',
      secret: process.env.LEANCLOUD_APP_MASTER_KEY!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: !!process.env.LEANCLOUD_APP_ENV,
      },
    }),
  );
  await app.listen(3000);
}
bootstrap();
