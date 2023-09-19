import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AssignQueuedJobData } from '../interfaces';
import { ChatService } from '../services';

@Processor('assign_queued_conversation')
export class AssignQueuedProcessor {
  constructor(private chatService: ChatService) {}

  @Process()
  async assign(job: Job<AssignQueuedJobData>) {
    const { operatorId, maxCount } = job.data;
    const conversationId = await this.chatService.dequeueConversation();
    if (!conversationId) {
      return;
    }
    await this.chatService.assignConversation(conversationId, operatorId);

    if (maxCount > 1) {
      await this.chatService.addAssignQueuedConversationJob(
        operatorId,
        maxCount - 1,
      );
    }
  }
}
