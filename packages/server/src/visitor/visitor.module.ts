import { Module } from '@nestjs/common';

import { ChatModule } from 'src/chat/chat.module';

import { VisitorGateway } from './visitor.gateway';
import { VisitorService } from './visitor.service';

@Module({
  imports: [ChatModule],
  providers: [VisitorGateway, VisitorService],
})
export class VisitorModule {}
