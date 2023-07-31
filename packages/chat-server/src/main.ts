import { NestFactory } from '@nestjs/core';
import AV from 'leancloud-storage';
import 'dotenv/config';

import { AppModule } from './app.module';

AV.init({
  appId: process.env.LEANCLOUD_APP_ID!,
  appKey: process.env.LEANCLOUD_APP_KEY!,
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY,
  serverURL: process.env.LEANCLOUD_API_SERVER,
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
