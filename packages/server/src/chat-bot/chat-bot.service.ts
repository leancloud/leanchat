import { Injectable } from '@nestjs/common';
import AV from 'leancloud-storage';
import _ from 'lodash';

import {
  ChatBotEdge,
  ChatBotNode,
  CreateChatBotData,
  UpdateChatBotData,
} from './interfaces';
import { ChatBot } from './chat-bot.entity';

@Injectable()
export class ChatBotService {
  validateChatBotNodes(nodes: ChatBotNode[], edges: ChatBotEdge[]) {
    if (this.detectFlowLoop(nodes, edges)) {
      return false;
    }
    return true;
  }

  detectFlowLoop(nodes: ChatBotNode[], edges: ChatBotEdge[]) {
    const nodeMap = _.keyBy(nodes, (node) => node.id);
    const visitedNodes = new Set<string>();
    const hasLoop = (node: ChatBotNode) => {
      if (visitedNodes.has(node.id)) {
        return true;
      }
      visitedNodes.add(node.id);
      const targets = edges
        .filter((edge) => edge.sourceNode === node.id)
        .map((edge) => edge.targetNode);
      for (const nextId of targets) {
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
      edges: data.edges,
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
    if (data.edges) {
      obj.set('edges', data.edges);
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
