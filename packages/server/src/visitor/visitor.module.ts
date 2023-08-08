import { Module } from '@nestjs/common';

import { MessageModule } from 'src/message/message.module';

import { VisitorGateway } from './visitor.gateway';
import { VisitorService } from './visitor.service';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    MessageModule,
    BullModule.registerQueue({
      name: 'assign_visitor',
    }),
  ],
  providers: [VisitorGateway, VisitorService],
  exports: [VisitorService],
})
export class VisitorModule {}
