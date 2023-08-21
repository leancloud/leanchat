import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';

import { QUEUE_CHAT_BOT_DISPATCH, QUEUE_CHAT_BOT_PROCESS } from '../constants';
import { ChatBotService } from '../chat-bot.service';
import { ChatBotDispatchJobData, ChatBotProcessJobData } from '../interfaces';

@Processor(QUEUE_CHAT_BOT_DISPATCH)
export class ChatBotDispatchProcessor {
  constructor(
    @InjectQueue(QUEUE_CHAT_BOT_PROCESS)
    private chatBotProcessQueue: Queue<ChatBotProcessJobData>,
    private chatBotService: ChatBotService,
  ) {}

  @Process()
  async dispatch(job: Job<ChatBotDispatchJobData>) {
    const { type, context } = job.data;

    const chatBots = await this.chatBotService.getChatBotsByNodeType(type);

    const datas: ChatBotProcessJobData[] = [];

    chatBots.forEach((chatBot) => {
      chatBot.nodes
        .filter((node) => node.type === type)
        .forEach((node) => {
          const edge = chatBot.edges.find(
            (edge) => edge.sourceNode === node.id,
          );
          if (edge) {
            datas.push({
              chatBotId: chatBot.id,
              nodes: chatBot.nodes,
              edges: chatBot.edges,
              nodeId: edge.targetNode,
              context,
            });
          }
        });
    });

    if (datas.length) {
      await this.chatBotProcessQueue.addBulk(datas.map((data) => ({ data })));
    }
  }
}
