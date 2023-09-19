import type { Conversation } from 'src/chat';

export class ConversationDto {
  id: string;

  visitorId: string;

  operatorId?: string;

  evaluation?: {
    star: number;
    feedback: string;
  };

  categoryId?: string;

  status: string;

  createdAt: string;

  updatedAt: string;

  static fromDocument(conv: Conversation) {
    const dto = new ConversationDto();
    dto.id = conv.id;
    dto.visitorId = conv.visitorId.toString();
    dto.operatorId = conv.operatorId?.toString();
    dto.evaluation = conv.evaluation;
    dto.status = conv.closedAt ? 'closed' : 'open';
    dto.createdAt = conv.createdAt.toISOString();
    dto.updatedAt = conv.updatedAt.toISOString();
    return dto;
  }
}
