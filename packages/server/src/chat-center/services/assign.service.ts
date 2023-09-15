import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { OnEvent } from '@nestjs/event-emitter';

import { ConversationCreatedEvent } from 'src/event';
import { AssignConversationJobData } from '../interfaces/assign-job';

@Injectable()
export class AssignService {
  constructor(
    @InjectQueue('assign_conversation')
    private assignVisitorQueue: Queue<AssignConversationJobData>,
  ) {}

  @OnEvent('conversation.created', { async: true })
  handleConversationCreated(payload: ConversationCreatedEvent) {
    this.assignConversation(payload.conversation.id);
  }

  async assignConversation(conversationId: string) {
    await this.assignVisitorQueue.add({ conversationId });
  }
}
