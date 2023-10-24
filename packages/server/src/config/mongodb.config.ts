import { registerAs } from '@nestjs/config';

import { expand } from './utils';

export const mongodbConfig = registerAs('mongodb', () => {
  const env = { ...process.env };
  const { LEANCHAT_MONGODB_URL } = env;

  return {
    url: LEANCHAT_MONGODB_URL && expand(LEANCHAT_MONGODB_URL, env),
  };
});
