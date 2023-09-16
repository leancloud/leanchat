import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { Module } from '@nestjs/common';

import { Conversation, Visitor } from './models';
import { ConversationService, VisitorService } from './services';

@Module({
  imports: [TypegooseModule.forFeature([Conversation, Visitor])],
  providers: [ConversationService, VisitorService],
})
export class ChatModule {}
