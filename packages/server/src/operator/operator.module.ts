import { Module } from '@nestjs/common';
import { TypegooseModule } from '@m8a/nestjs-typegoose';

import { Operator } from './operator.model';
import { OperatorService } from './operator.service';

@Module({
  imports: [TypegooseModule.forFeature([Operator])],
  providers: [OperatorService],
  exports: [OperatorService],
})
export class OperatorModule {}
