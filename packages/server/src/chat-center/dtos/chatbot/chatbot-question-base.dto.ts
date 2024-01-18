import type { ChatbotQuestionBase } from 'src/chat/models';

export class ChatbotQuestionBaseDto {
  id: string;

  name: string;

  createdAt: string;

  updatedAt: string;

  static fromDocument(base: ChatbotQuestionBase) {
    const dto = new ChatbotQuestionBaseDto();
    dto.id = base.id || base._id.toHexString();
    dto.name = base.name;
    dto.createdAt = base.createdAt.toISOString();
    dto.updatedAt = base.updatedAt.toISOString();
    return dto;
  }
}
