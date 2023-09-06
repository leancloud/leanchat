import { Module } from '@nestjs/common';
import { TypegooseModule } from '@m8a/nestjs-typegoose';

import { MessageModule } from 'src/message/message.module';
import { Visitor } from './visitor.model';
import { VisitorService } from './visitor.service';

@Module({
  imports: [TypegooseModule.forFeature([Visitor]), MessageModule],
  providers: [VisitorService],
  exports: [VisitorService],
})
export class VisitorModule {}
