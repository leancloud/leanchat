import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { ConversationCreatedEvent } from 'src/event';
import { QUEUE_CHAT_BOT_DISPATCH } from './constants';
import { ChatBotDispatchJobData } from './interfaces';

@Injectable()
export class EventHandler {
  constructor(
    @InjectQueue(QUEUE_CHAT_BOT_DISPATCH)
    private chatBotDispatchQueue: Queue<ChatBotDispatchJobData>,
  ) {}

  @OnEvent('conversation.created', { async: true })
  handleOnConversationCreated(payload: ConversationCreatedEvent) {
    this.chatBotDispatchQueue.add({
      type: 'onConversationCreated',
      context: {
        conversationId: payload.conversation.id,
      },
    });
  }
}
