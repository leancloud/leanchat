import { ChatbotEdge, ChatbotNode } from './interfaces';

export class Chatbot {
  id: string;

  name: string;

  nodes: ChatbotNode[];

  edges: ChatbotEdge[];

  createdAt: Date;

  static fromAVObject(obj: { get(key: string): any }) {
    const bot = new Chatbot();
    bot.id = obj.get('objectId');
    bot.name = obj.get('name');
    bot.nodes = obj.get('nodes');
    bot.edges = obj.get('edges');
    bot.createdAt = obj.get('createdAt');
    return bot;
  }
}
