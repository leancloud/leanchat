import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import session from 'express-session';
import Redis from 'ioredis';
import RedisStore from 'connect-redis';
import AV from 'leancloud-storage';
import 'dotenv/config';

import { AppModule } from './app.module';
import { WsAdapter } from './ws-adapter';

AV.init({
  appId: process.env.LEANCLOUD_APP_ID!,
  appKey: process.env.LEANCLOUD_APP_KEY!,
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY,
  serverURL: process.env.LEANCLOUD_API_SERVER,
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enable('trust proxy');
  app.disable('x-powered-by');
  app.setGlobalPrefix('api');

  const client = new Redis(process.env.REDIS_URL_CACHE!, {
    lazyConnect: true,
  });
  await client.connect();
  const sessionMiddleware = session({
    store: new RedisStore({
      client,
      prefix: 'chat_session:',
    }),
    name: 'sid',
    secret: process.env.LEANCLOUD_APP_MASTER_KEY!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: !!process.env.LEANCLOUD_APP_ENV,
    },
  });

  app.use(sessionMiddleware);

  const wsAdapter = new WsAdapter(app);
  wsAdapter.use(sessionMiddleware);
  app.useWebSocketAdapter(wsAdapter);

  await app.listen(3000);
}
bootstrap();
