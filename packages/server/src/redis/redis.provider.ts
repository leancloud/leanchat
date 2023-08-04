import { FactoryProvider } from '@nestjs/common';
import Redis from 'ioredis';

import { REDIS } from './constants';

export const redisProvider: FactoryProvider = {
  provide: REDIS,
  useFactory: () => {
    return new Redis(process.env.REDIS_URL_CACHE!);
  },
};
