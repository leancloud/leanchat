import { ChatBotNode } from './interfaces';

export class ChatBot {
  id: string;

  name: string;

  nodes: ChatBotNode[];

  createdAt: Date;

  static fromAVObject(obj: { get(key: string): any }) {
    const bot = new ChatBot();
    bot.id = obj.get('objectId');
    bot.name = obj.get('name');
    bot.nodes = obj.get('nodes');
    bot.createdAt = obj.get('createdAt');
    return bot;
  }
}
