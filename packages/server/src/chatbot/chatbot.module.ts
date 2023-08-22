import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { ConversationModule } from 'src/conversation/conversation.module';
import { MessageModule } from 'src/message/message.module';
import { ChatCenterModule } from 'src/chat-center/chat-center.module';
import { ChatbotService } from './chatbot.service';
import { QUEUE_CHATBOT_DISPATCH, QUEUE_CHATBOT_PROCESS } from './constants';
import {
  ChatbotDispatchProcessor,
  ChatbotProcessProcessor,
} from './processors';
import { EventHandler } from './event-handler';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: QUEUE_CHATBOT_DISPATCH,
      },
      {
        name: QUEUE_CHATBOT_PROCESS,
      },
    ),
    ConversationModule,
    MessageModule,
    forwardRef(() => ChatCenterModule),
  ],
  providers: [
    ChatbotService,
    ChatbotDispatchProcessor,
    ChatbotProcessProcessor,
    EventHandler,
  ],
  exports: [ChatbotService],
})
export class ChatbotModule {}
