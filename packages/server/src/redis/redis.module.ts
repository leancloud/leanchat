import { Global, Module } from '@nestjs/common';

import { redisProvider } from './redis.provider';

@Global()
@Module({
  providers: [redisProvider],
})
export class RedisModule {}
