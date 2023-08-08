import { Module } from '@nestjs/common';

import { ChatCenterModule } from 'src/chat-center/chat-center.module';
import { VisitorModule } from 'src/visitor/visitor.module';
import { MessageModule } from 'src/message/message.module';
import { VisitorGateway } from './visitor.gateway';

@Module({
  imports: [ChatCenterModule, VisitorModule, MessageModule],
  providers: [VisitorGateway],
})
export class VisitorChannelModule {}
