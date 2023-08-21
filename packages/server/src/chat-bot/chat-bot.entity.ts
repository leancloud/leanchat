import { ChatBotEdge, ChatBotNode } from './interfaces';

export class ChatBot {
  id: string;

  name: string;

  nodes: ChatBotNode[];

  edges: ChatBotEdge[];

  createdAt: Date;

  static fromAVObject(obj: { get(key: string): any }) {
    const bot = new ChatBot();
    bot.id = obj.get('objectId');
    bot.name = obj.get('name');
    bot.nodes = obj.get('nodes');
    bot.edges = obj.get('edges');
    bot.createdAt = obj.get('createdAt');
    return bot;
  }
}
