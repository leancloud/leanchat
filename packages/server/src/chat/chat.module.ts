import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { Module } from '@nestjs/common';

import { Conversation, Message, Visitor } from './models';
import {
  ConversationService,
  MessageService,
  VisitorService,
} from './services';

@Module({
  imports: [TypegooseModule.forFeature([Conversation, Message, Visitor])],
  providers: [ConversationService, MessageService, VisitorService],
})
export class ChatModule {}
