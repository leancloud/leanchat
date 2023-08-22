import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';

import { QUEUE_CHATBOT_DISPATCH, QUEUE_CHATBOT_PROCESS } from '../constants';
import { ChatbotService } from '../chatbot.service';
import { ChatbotDispatchJobData, ChatbotProcessJobData } from '../interfaces';

@Processor(QUEUE_CHATBOT_DISPATCH)
export class ChatbotDispatchProcessor {
  constructor(
    @InjectQueue(QUEUE_CHATBOT_PROCESS)
    private chatbotProcessQueue: Queue<ChatbotProcessJobData>,
    private chatbotService: ChatbotService,
  ) {}

  @Process()
  async dispatch(job: Job<ChatbotDispatchJobData>) {
    const { type, context } = job.data;

    const chatbots = await this.chatbotService.getChatbotsByNodeType(type);

    const datas: ChatbotProcessJobData[] = [];

    chatbots.forEach((chatbot) => {
      chatbot.nodes
        .filter((node) => node.type === type)
        .forEach((node) => {
          const edge = chatbot.edges.find(
            (edge) => edge.sourceNode === node.id,
          );
          if (edge) {
            datas.push({
              chatbotId: chatbot.id,
              nodes: chatbot.nodes,
              edges: chatbot.edges,
              nodeId: edge.targetNode,
              context,
            });
          }
        });
    });

    if (datas.length) {
      await this.chatbotProcessQueue.addBulk(datas.map((data) => ({ data })));
    }
  }
}
