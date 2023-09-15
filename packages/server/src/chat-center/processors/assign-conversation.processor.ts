import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { OperatorService } from 'src/operator';
import { ConversationService } from 'src/conversation';
import { AssignConversationJobData } from '../interfaces/assign-job';
import { ChatConversationService } from '../services/chat-conversation.service';

@Processor('assign_conversation')
export class AssignConversationProcessor {
  constructor(
    private conversationService: ConversationService,
    private operatorService: OperatorService,
    private chatConvService: ChatConversationService,
  ) {}

  @Process()
  async assign(job: Job<AssignConversationJobData>) {
    const { conversationId } = job.data;
    const conv = await this.conversationService.getConversation(conversationId);
    if (!conv) {
      return;
    }

    const operator = await this.selectOperator();
    if (operator) {
      await this.chatConvService.assign(conv, operator);
    } else {
      await this.chatConvService.enqueue(conv);
    }
  }

  async selectOperator() {
    const operatorStatus = await this.operatorService.getOperatorStatuses();
    const readyOperatorIds = Object.entries(operatorStatus)
      .filter(([, status]) => status === 'ready')
      .map(([id]) => id);
    if (readyOperatorIds.length === 0) {
      return;
    }

    const readyOperators = await this.operatorService.getOperators({
      ids: readyOperatorIds,
    });
    if (readyOperators.length === 0) {
      return;
    }

    const operatorIds = readyOperators.map((o) => o.id);
    const concurrencyMap = await this.operatorService.getOperatorConcurrencies(
      operatorIds,
    );

    for (const operator of readyOperators) {
      const concurrency = concurrencyMap[operator.id];
      if (concurrency !== undefined && operator.concurrency > concurrency) {
        return operator;
      }
    }
  }
}
