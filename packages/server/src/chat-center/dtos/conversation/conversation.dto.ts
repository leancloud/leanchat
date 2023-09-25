import type { Conversation } from 'src/chat';

export class ConversationDto {
  id: string;

  visitorId: string;

  operatorId?: string;

  categoryId?: string;

  evaluation?: {
    star: number;
    feedback: string;
  };

  status: string;

  visitorWaitingSince?: string;

  createdAt: string;

  updatedAt: string;

  lastMessage?: any;

  static fromDocument(conv: Conversation) {
    const dto = new ConversationDto();
    dto.id = conv.id;
    dto.visitorId = conv.visitorId.toString();
    dto.operatorId = conv.operatorId?.toString();
    dto.categoryId = conv.categoryId?.toString();
    dto.evaluation = conv.evaluation;
    dto.status = conv.closedAt ? 'closed' : 'open';
    dto.visitorWaitingSince = conv.visitorWaitingSince?.toISOString();
    dto.createdAt = conv.createdAt.toISOString();
    dto.updatedAt = conv.updatedAt.toISOString();
    return dto;
  }
}
