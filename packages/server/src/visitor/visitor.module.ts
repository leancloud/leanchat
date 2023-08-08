import { Module } from '@nestjs/common';

import { MessageModule } from 'src/message/message.module';

import { VisitorService } from './visitor.service';

@Module({
  imports: [MessageModule],
  providers: [VisitorService],
  exports: [VisitorService],
})
export class VisitorModule {}
