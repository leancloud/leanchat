import { Inject } from '@nestjs/common';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { Redis } from 'ioredis';

import { ConversationService } from 'src/conversation';
import { MessageService } from 'src/message';
import { REDIS } from 'src/redis';
import { ChatConversationService } from 'src/chat-center/services';
import { QUEUE_CHATBOT_PROCESS } from '../constants';
import {
  ChatbotNode,
  ChatbotProcessJobData,
  DoCloseConversation,
  DoSendMessage,
  OnVisitorInactive,
} from '../interfaces';

@Processor(QUEUE_CHATBOT_PROCESS)
export class ChatbotProcessProcessor {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
    @InjectQueue(QUEUE_CHATBOT_PROCESS)
    private queue: Queue<ChatbotProcessJobData>,
    private conversationService: ConversationService,
    private messageService: MessageService,
    private chatConvService: ChatConversationService,
  ) {}

  @Process()
  async process(job: Job<ChatbotProcessJobData>) {
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
      case 'onVisitorInactive':
        nextId = await this.processOnVisitorInactive(node, job.data);
        break;
      case 'doSendMessage':
        nextId = await this.processDoSendMessage(node, job.data);
        break;
      case 'doCloseConversation':
        nextId = await this.processDoCloseConversation(node, job.data);
        break;
    }

    if (nextId) {
      await this.queue.add({
        ...job.data,
        nodeId: nextId,
      });
    }
  }

  getNextNodeId(node: ChatbotNode, data: ChatbotProcessJobData) {
    return data.edges.find((edge) => edge.sourceNode === node.id)?.targetNode;
  }

  async processOnVisitorInactive(
    node: OnVisitorInactive,
    data: ChatbotProcessJobData,
  ) {
    if (node.repeatInterval) {
      const key = `chatbot_event_lock_${data.chatbotId}_${node.id}_${data.context.conversationId}`;
      const res = await this.redis.set(key, 1, 'EX', node.repeatInterval, 'NX');
      if (res !== 'OK') {
        return;
      }
    }

    const conv = await this.conversationService.getConversation(
      data.context.conversationId,
    );
    if (!conv) {
      return;
    }

    const lastActAt = conv.timestamps.visitorLastMessageAt || conv.createdAt;
    const inactiveAt = lastActAt.getTime() + node.inactiveDuration * 1000;
    if (Date.now() < inactiveAt) {
      return;
    }

    return this.getNextNodeId(node, data);
  }

  async processDoSendMessage(node: DoSendMessage, data: ChatbotProcessJobData) {
    const { chatbotId, context } = data;
    const { conversationId } = context;
    const conv = await this.conversationService.getConversation(conversationId);
    if (conv) {
      const message = await this.messageService.createMessage({
        visitorId: conv.visitorId,
        conversationId: conv.id,
        type: 'message',
        from: { type: 'chatbot', id: chatbotId },
        data: node.message,
      });
      await this.conversationService.updateConversation(conv, {
        lastMessage: message,
      });
    }
    return this.getNextNodeId(node, data);
  }

  async processDoCloseConversation(
    node: DoCloseConversation,
    data: ChatbotProcessJobData,
  ) {
    const conv = await this.conversationService.getConversation(
      data.context.conversationId,
    );
    if (!conv) {
      return;
    }
    await this.chatConvService.close(conv);
    return this.getNextNodeId(node, data);
  }
}
