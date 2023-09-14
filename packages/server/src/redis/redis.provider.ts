import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { REDIS } from './constants';

export const redisProvider: FactoryProvider = {
  provide: REDIS,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    return new Redis(config.getOrThrow('redis.cache'), {
      keyPrefix: 'chat:',
    });
  },
};
