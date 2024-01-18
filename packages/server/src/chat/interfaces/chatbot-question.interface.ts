import type { Types } from 'mongoose';

import type { ChatbotQuestionMatcher } from '../constants';
import type { ChatbotMessage } from '../models/chatbot-message.model';

export interface CreateChatbotQuestionBaseData {
  name: string;
}

export interface UpdateChatbotQuestionBaseData {
  name?: string;
}

export interface CreateChatbotQuestionData {
  questionBaseId: string | Types.ObjectId;
  matcher: ChatbotQuestionMatcher;
  question: string;
  similarQuestions?: string[];
  answer: ChatbotMessage;
  nextQuestionBaseId?: string;
  assignOperator?: boolean;
}

export interface UpdateChatbotQuestionData {
  matcher?: ChatbotQuestionMatcher;
  question?: string;
  similarQuestions?: string[];
  answer?: ChatbotMessage;
  nextQuestionBaseId?: string | null;
  assignOperator?: boolean;
}
