import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job, Queue } from 'bull';

import { ConversationService } from 'src/conversation';
import { MessageService } from 'src/message';
import { QUEUE_CHAT_BOT_PROCESS } from '../constants';
import {
  ChatBotNode,
  ChatBotProcessJobData,
  DoSendMessageConfig,
} from '../interfaces';

@Processor(QUEUE_CHAT_BOT_PROCESS)
export class ChatBotProcessProcessor {
  constructor(
    private events: EventEmitter2,
    @InjectQueue(QUEUE_CHAT_BOT_PROCESS)
    private queue: Queue<ChatBotProcessJobData>,
    private conversationService: ConversationService,
    private messageService: MessageService,
  ) {}

  @Process()
  async process(job: Job<ChatBotProcessJobData>) {
    const { nodes, nodeId } = job.data;

    const node = nodes.find((node) => node.id === nodeId);
    if (!node) {
      return;
    }

    let nextIds: string[] = [];
    switch (node.type) {
      case 'onConversationCreated':
        nextIds = this.processEventNode(node);
        break;
      case 'doSendMessage':
        nextIds = await this.processDoSendMessage(job.data, node);
        break;
    }

    if (nextIds.length) {
      await this.queue.addBulk(
        nextIds
          .map((nodeId) => ({ ...job.data, nodeId }))
          .map((data) => ({ data })),
      );
    }
  }

  processEventNode(node: ChatBotNode) {
    return node.next;
  }

  async processDoSendMessage(
    data: ChatBotProcessJobData,
    node: DoSendMessageConfig,
  ) {
    const { chatBotId, context } = data;
    const { conversationId } = context;
    const conv = await this.conversationService.getConversation(conversationId);
    if (conv) {
      await this.messageService.createMessage({
        visitorId: conv.visitorId,
        conversationId: conv.id,
        type: 'chat-bot',
        from: chatBotId,
        data: node.message,
      });
    }
    return node.next;
  }
}
