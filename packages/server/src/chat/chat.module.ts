import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { Module } from '@nestjs/common';

import { Visitor } from './models';
import { VisitorService } from './services';

@Module({
  imports: [TypegooseModule.forFeature([Visitor])],
  providers: [VisitorService],
})
export class ChatModule {}
