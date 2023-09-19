import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { Conversation, Message, Operator, Visitor } from './models';
import {
  ChatService,
  ConversationService,
  MessageService,
  OperatorService,
  VisitorService,
} from './services';
import { AutoAssignProcessor } from './processors/auto-assign.processor';

@Module({
  imports: [
    TypegooseModule.forFeature([Conversation, Message, Visitor, Operator]),
    BullModule.registerQueue({
      name: 'auto_assign_conversation',
    }),
  ],
  providers: [
    ConversationService,
    MessageService,
    VisitorService,
    ChatService,
    OperatorService,
    AutoAssignProcessor,
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
