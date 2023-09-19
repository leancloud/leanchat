import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { Module } from '@nestjs/common';

import { Conversation, Message, Operator, Visitor } from './models';
import {
  ChatService,
  ConversationService,
  MessageService,
  OperatorService,
  VisitorService,
} from './services';

@Module({
  imports: [
    TypegooseModule.forFeature([Conversation, Message, Visitor, Operator]),
  ],
  providers: [
    ConversationService,
    MessageService,
    VisitorService,
    ChatService,
    OperatorService,
  ],
  exports: [
    ChatService,
    ConversationService,
    MessageService,
    VisitorService,
    OperatorService,
  ],
})
export class ChatModule {}
