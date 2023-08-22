import { Injectable } from '@nestjs/common';
import AV from 'leancloud-storage';
import _ from 'lodash';

import {
  ChatbotEdge,
  ChatbotNode,
  CreateChatbotData,
  UpdateChatbotData,
} from './interfaces';
import { Chatbot } from './chatbot.entity';

@Injectable()
export class ChatbotService {
  validateChatbotNodes(nodes: ChatbotNode[], edges: ChatbotEdge[]) {
    if (this.detectFlowLoop(nodes, edges)) {
      return false;
    }
    return true;
  }

  detectFlowLoop(nodes: ChatbotNode[], edges: ChatbotEdge[]) {
    const nodeMap = _.keyBy(nodes, (node) => node.id);
    const visitedNodes = new Set<string>();
    const hasLoop = (node: ChatbotNode) => {
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

  async createChatbot(data: CreateChatbotData) {
    const obj = new AV.Object('ChatBot', {
      name: data.name,
      nodes: data.nodes,
      edges: data.edges,
    });
    await obj.save(null, { useMasterKey: true });
    return Chatbot.fromAVObject(obj);
  }

  async getChatbots() {
    const query = new AV.Query('ChatBot');
    query.select('name');
    const objs = await query.find({ useMasterKey: true });
    return objs.map(Chatbot.fromAVObject) as Pick<
      Chatbot,
      'id' | 'name' | 'createdAt'
    >[];
  }

  async getChatbot(id: string) {
    const query = new AV.Query('ChatBot');
    query.equalTo('objectId', id);
    const obj = await query.first({ useMasterKey: true });
    return obj && Chatbot.fromAVObject(obj);
  }

  async updateChatbot(chatbot: Chatbot, data: UpdateChatbotData) {
    const obj = AV.Object.createWithoutData('ChatBot', chatbot.id);
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

  async getChatbotsByNodeType(nodeType: string) {
    const query = new AV.Query('ChatBot');
    query.equalTo('nodes.type', nodeType);
    const objs = await query.find({ useMasterKey: true });
    return objs.map(Chatbot.fromAVObject);
  }
}
