import { InjectQueue, Process, Processor } from '@nestjs/bull';
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

    let nextId: string | undefined;
    switch (node.type) {
      case 'onConversationCreated':
        nextId = this.getNextNodeId(node, job.data);
        break;
      case 'doSendMessage':
        nextId = await this.processDoSendMessage(job.data, node);
        break;
    }

    if (nextId) {
      await this.queue.add({
        ...job.data,
        nodeId: nextId,
      });
    }
  }

  getNextNodeId(node: ChatBotNode, data: ChatBotProcessJobData) {
    return data.edges.find((edge) => edge.sourceNode === node.id)?.targetNode;
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
    return this.getNextNodeId(node, data);
  }
}
