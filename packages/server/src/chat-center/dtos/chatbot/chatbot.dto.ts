import { ChatbotMessage } from 'src/chat/interfaces';
import type { Chatbot } from 'src/chat/models';

export class ChatbotDto {
  id: string;

  name: string;

  acceptRule: number;

  globalQuestionBaseIds: string[];

  initialQuestionBaseIds: string[];

  greetingMessage: ChatbotMessage;

  noMatchMessage: ChatbotMessage;

  createdAt: string;

  updatedAt: string;

  static fromDocument(chatbot: Chatbot) {
    const dto = new ChatbotDto();
    dto.id = chatbot.id || chatbot._id.toHexString();
    dto.name = chatbot.name;
    dto.acceptRule = chatbot.acceptRule;
    dto.globalQuestionBaseIds = chatbot.globalQuestionBaseIds.map((id) =>
      id.toHexString(),
    );
    dto.initialQuestionBaseIds = chatbot.initialQuestionBaseIds.map((id) =>
      id.toHexString(),
    );
    dto.greetingMessage = chatbot.greetingMessage;
    dto.noMatchMessage = chatbot.noMatchMessage;
    dto.createdAt = chatbot.createdAt.toISOString();
    dto.updatedAt = chatbot.updatedAt.toISOString();
    return dto;
  }
}
