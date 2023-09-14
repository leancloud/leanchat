import { registerAs } from '@nestjs/config';

import { expand } from './utils';

export const mongodbConfig = registerAs('mongodb', () => {
  const env = { ...process.env };
  const { MONGODB_URL } = env;

  return {
    url: MONGODB_URL && expand(MONGODB_URL, env),
  };
});
