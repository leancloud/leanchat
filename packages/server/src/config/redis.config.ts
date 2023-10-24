import { registerAs } from '@nestjs/config';

import { expand } from './utils';

export const redisConfig = registerAs('redis', () => {
  const env = { ...process.env };
  const {
    LEANCHAT_REDIS_URL_CACHE,
    LEANCHAT_REDIS_URL_QUEUE,
    LEANCHAT_REDIS_URL_MESSAGE,
  } = env;

  return {
    cache: LEANCHAT_REDIS_URL_CACHE && expand(LEANCHAT_REDIS_URL_CACHE, env),
    queue: LEANCHAT_REDIS_URL_QUEUE && expand(LEANCHAT_REDIS_URL_QUEUE, env),
    message:
      LEANCHAT_REDIS_URL_MESSAGE && expand(LEANCHAT_REDIS_URL_MESSAGE, env),
  };
});
