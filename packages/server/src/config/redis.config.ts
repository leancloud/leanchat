import { registerAs } from '@nestjs/config';

import { expand } from './utils';

export const redisConfig = registerAs('redis', () => {
  const env = { ...process.env };
  const { REDIS_URL_CACHE, REDIS_URL_QUEUE, REDIS_URL_MESSAGE } = env;

  console.log(
    'Redis config:',
    { REDIS_URL_CACHE, REDIS_URL_QUEUE, REDIS_URL_MESSAGE },
    {
      cache: REDIS_URL_CACHE && expand(REDIS_URL_CACHE, env),
      queue: REDIS_URL_QUEUE && expand(REDIS_URL_QUEUE, env),
      message: REDIS_URL_MESSAGE && expand(REDIS_URL_MESSAGE, env),
    },
  );

  return {
    cache: REDIS_URL_CACHE && expand(REDIS_URL_CACHE, env),
    queue: REDIS_URL_QUEUE && expand(REDIS_URL_QUEUE, env),
    message: REDIS_URL_MESSAGE && expand(REDIS_URL_MESSAGE, env),
  };
});
