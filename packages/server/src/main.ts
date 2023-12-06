import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import session from 'express-session';
import Redis from 'ioredis';
import RedisStore from 'connect-redis';

import { AppModule } from './app.module';
import { WsAdapter } from './ws-adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enable('trust proxy');
  app.disable('x-powered-by');
  app.setGlobalPrefix('api');

  const config = app.get(ConfigService);

  const client = new Redis(config.getOrThrow('redis.cache'), {
    lazyConnect: true,
  });
  await client.connect();
  const sessionMiddleware = session({
    store: new RedisStore({
      client,
      prefix: 'chat:session:',
    }),
    name: 'sid',
    secret: config.getOrThrow('LEANCLOUD_APP_MASTER_KEY'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: !!config.get('LEANCLOUD_APP_ENV'),
    },
  });

  app.use(sessionMiddleware);

  const wsAdapter = new WsAdapter(app);
  wsAdapter.use(sessionMiddleware);
  app.useWebSocketAdapter(wsAdapter);
  await wsAdapter.connectToRedis(config.get('redis.message'));

  app.enableShutdownHooks();

  await app.listen(config.get('LEANCLOUD_APP_PORT', 3000));
}
bootstrap();
