import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConversationService } from './conversation/conversation.service';
import { ChatGateway } from './chat/chat.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ConversationService, ChatGateway],
})
export class AppModule {}
