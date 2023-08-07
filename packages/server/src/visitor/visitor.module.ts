import { Module } from '@nestjs/common';

import { MessageModule } from 'src/message/message.module';

import { VisitorGateway } from './visitor.gateway';
import { VisitorService } from './visitor.service';

@Module({
  imports: [MessageModule],
  providers: [VisitorGateway, VisitorService],
  exports: [VisitorService],
})
export class VisitorModule {}
