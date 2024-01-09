import { Inject } from '@nestjs/common';

import { REDIS } from './constants';

export const InjectRedis = () => Inject(REDIS);
