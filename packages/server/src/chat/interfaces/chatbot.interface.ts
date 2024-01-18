import { ChatbotAcceptRule } from '../constants';

export interface ChatbotContext {
  questionBaseIds?: string[];
  operatorAssigned?: boolean;
}

export interface ChatbotMessage {
  text: string;
}

export interface CreateChatbotData {
  name: string;
  acceptRule?: ChatbotAcceptRule;
  globalQuestionBaseIds: string[];
  initialQuestionBaseIds: string[];
  greetingMessage: ChatbotMessage;
  noMatchMessage: ChatbotMessage;
}

export interface UpdateChatbotData {
  name?: string;
  acceptRule?: ChatbotAcceptRule | null;
  globalQuestionBaseIds?: string[];
  initialQuestionBaseIds?: string[];
  greetingMessage?: ChatbotMessage;
  noMatchMessage?: ChatbotMessage;
}

export interface ChatbotMessageJobData {
  conversationId: string;
  chatbotId: string;
  message: ChatbotMessage;
}
