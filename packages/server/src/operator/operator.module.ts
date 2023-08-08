import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

import { OperatorService } from './operator.service';

@Module({
  imports: [
    CacheModule.register({
      max: 100,
      ttl: 60 * 60, // 1 hour
    }),
  ],
  providers: [OperatorService],
  exports: [OperatorService],
})
export class OperatorModule {}
