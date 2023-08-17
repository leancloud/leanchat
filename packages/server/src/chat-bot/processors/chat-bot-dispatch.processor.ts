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

    const datas = chatBots.flatMap((chatBot) =>
      chatBot.nodes
        .filter((node) => node.type === type)
        .flatMap((node) => node.next)
        .map((nodeId) => {
          return {
            chatBotId: chatBot.id,
            nodes: chatBot.nodes,
            nodeId,
            context,
          };
        }),
    );

    if (datas.length) {
      await this.chatBotProcessQueue.addBulk(datas.map((data) => ({ data })));
    }
  }
}
