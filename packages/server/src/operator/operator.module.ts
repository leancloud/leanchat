import { Module } from '@nestjs/common';

import { OperatorService } from './operator.service';
import { OperatorController } from './operator.controller';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      max: 100,
      ttl: 60 * 60, // 1 hour
    }),
  ],
  providers: [OperatorService],
  controllers: [OperatorController],
  exports: [OperatorService],
})
export class OperatorModule {}
