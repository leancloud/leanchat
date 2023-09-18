import { Module } from '@nestjs/common';

import { ChatModule } from 'src/chat';
import { VisitorGateway } from './visitor.gateway';
import { VisitorChannelService } from './visitor-channel.service';

@Module({
  imports: [ChatModule],
  providers: [VisitorGateway, VisitorChannelService],
})
export class VisitorChannelModule {}
