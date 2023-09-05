import { ChatbotDocument } from 'src/chatbot';
import { ChatbotEdge, ChatbotNode } from 'src/chatbot/interfaces';

export class ChatbotDto {
  id: string;

  name: string;

  nodes: ChatbotNode[];

  edges: ChatbotEdge[];

  createdAt: string;

  updatedAt: string;

  static fromDocument(chatbot: ChatbotDocument) {
    const dto = new ChatbotDto();
    dto.id = chatbot.id;
    dto.name = chatbot.name;
    dto.nodes = chatbot.nodes;
    dto.edges = chatbot.edges;
    dto.createdAt = chatbot.createdAt.toISOString();
    dto.updatedAt = chatbot.updatedAt.toISOString();
    return dto;
  }
}
