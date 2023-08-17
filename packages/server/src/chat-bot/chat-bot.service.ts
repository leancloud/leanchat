import { Injectable } from '@nestjs/common';
import AV from 'leancloud-storage';
import _ from 'lodash';

import { ChatBotNodeSchema } from './schemas';
import {
  ChatBotNode,
  CreateChatBotData,
  UpdateChatBotData,
} from './interfaces';
import { ChatBot } from './chat-bot.entity';

@Injectable()
export class ChatBotService {
  validateChatBotNodes(nodes: unknown[]) {
    const parsedNodes: ChatBotNode[] = [];
    for (const node of nodes) {
      const result = ChatBotNodeSchema.safeParse(node);
      if (!result.success) {
        return false;
      }
      parsedNodes.push(result.data);
    }
    if (this.detectFlowLoop(parsedNodes)) {
      return false;
    }
    return true;
  }

  detectFlowLoop(nodes: ChatBotNode[]) {
    const nodeMap = _.keyBy(nodes, (node) => node.id);
    const visitedNodes = new Set<string>();
    const hasLoop = (node: ChatBotNode) => {
      if (visitedNodes.has(node.id)) {
        return true;
      }
      visitedNodes.add(node.id);
      for (const nextId of node.next) {
        const node = nodeMap[nextId];
        if (node && hasLoop(node)) {
          return true;
        }
      }
      visitedNodes.delete(node.id);
      return false;
    };
    return nodes.some(hasLoop);
  }

  async createChatBot(data: CreateChatBotData) {
    const obj = new AV.Object('ChatBot', {
      name: data.name,
      nodes: data.nodes,
    });
    await obj.save(null, { useMasterKey: true });
    return ChatBot.fromAVObject(obj);
  }

  async getChatBots() {
    const query = new AV.Query('ChatBot');
    query.select('name');
    const objs = await query.find({ useMasterKey: true });
    return objs.map(ChatBot.fromAVObject) as Pick<
      ChatBot,
      'id' | 'name' | 'createdAt'
    >[];
  }

  async getChatBot(id: string) {
    const query = new AV.Query('ChatBot');
    query.equalTo('objectId', id);
    const obj = await query.first({ useMasterKey: true });
    return obj && ChatBot.fromAVObject(obj);
  }

  async updateChatBot(chatBot: ChatBot, data: UpdateChatBotData) {
    const obj = AV.Object.createWithoutData('ChatBot', chatBot.id);
    if (data.name) {
      obj.set('name', data.name);
    }
    if (data.nodes) {
      obj.set('nodes', data.nodes);
    }
    await obj.save(null, { useMasterKey: true });
  }

  async getChatBotsByNodeType(nodeType: string) {
    const query = new AV.Query('ChatBot');
    query.equalTo('nodes.type', nodeType);
    const objs = await query.find({ useMasterKey: true });
    return objs.map(ChatBot.fromAVObject);
  }
}
