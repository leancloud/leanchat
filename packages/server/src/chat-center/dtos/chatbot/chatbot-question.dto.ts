import { ChatbotMessage } from 'src/chat/interfaces';
import type { ChatbotQuestion } from 'src/chat/models';

export class ChatbotQuestionDto {
  id: string;

  matcher: number;

  question: string;

  similarQuestions?: string[];

  answer: ChatbotMessage;

  nextQuestionBaseId?: string;

  assignOperator?: boolean;

  createdAt: string;

  updatedAt: string;

  static fromDocument(question: ChatbotQuestion) {
    const dto = new ChatbotQuestionDto();
    dto.id = question.id || question._id.toHexString();
    dto.matcher = question.matcher;
    dto.question = question.question;
    dto.similarQuestions = question.similarQuestions;
    dto.answer = question.answer;
    dto.nextQuestionBaseId = question.nextQuestionBaseId?.toHexString();
    dto.assignOperator = question.assignOperator;
    dto.createdAt = question.createdAt.toISOString();
    dto.updatedAt = question.updatedAt.toISOString();
    return dto;
  }
}
