import { Injectable } from '@nestjs/common';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import _ from 'lodash';

import {
  ChatbotEdge,
  ChatbotNode,
  CreateChatbotData,
  UpdateChatbotData,
} from './interfaces';
import { Chatbot, ChatbotDocument } from './chatbot.model';

@Injectable()
export class ChatbotService {
  @InjectModel(Chatbot)
  private chatbotModel: ReturnModelType<typeof Chatbot>;

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

  createChatbot(data: CreateChatbotData) {
    const chatbot = new this.chatbotModel({
      name: data.name,
      nodes: data.nodes,
      edges: data.edges,
    });
    return chatbot.save();
  }

  getChatbots() {
    return this.chatbotModel
      .find()
      .select(['name', 'createdAt', 'updatedAt'])
      .exec();
  }

  getChatbot(id: string) {
    return this.chatbotModel.findById(id).exec();
  }

  updateChatbot(chatbot: ChatbotDocument, data: UpdateChatbotData) {
    if (data.name) {
      chatbot.set('name', data.name);
    }
    if (data.nodes) {
      chatbot.set('nodes', data.nodes);
    }
    if (data.edges) {
      chatbot.set('edges', data.edges);
    }
    return chatbot.save();
  }

  getChatbotsByNodeType(nodeType: string) {
    return this.chatbotModel
      .find({
        'nodes.type': nodeType,
      })
      .exec();
  }
}
