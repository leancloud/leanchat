import { expandEnv } from './utils';

export function expandedEnvFactory() {
  return expandEnv([
    'REDIS_URL_CACHE',
    'REDIS_URL_QUEUE',
    'REDIS_URL_MESSAGE',
    'MONGODB_URL',
  ]);
}
