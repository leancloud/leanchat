import type { Conversation } from 'src/chat';
import type { VisitorDto } from '../visitor';

export class ConversationDto {
  id: string;

  status: number;

  visitorId: string;

  operatorId?: string;

  categoryId?: string;

  evaluation?: {
    star: number;
    feedback: string;
  };

  visitorWaitingSince?: string;

  createdAt: string;

  updatedAt: string;

  lastMessage?: any;

  visitor?: VisitorDto;

  static fromDocument(conv: Conversation) {
    const dto = new ConversationDto();
    dto.id = conv.id;
    dto.status = conv.status;
    dto.visitorId = conv.visitorId.toString();
    dto.operatorId = conv.operatorId?.toString();
    dto.categoryId = conv.categoryId?.toString();
    dto.evaluation = conv.evaluation;
    dto.visitorWaitingSince = conv.visitorWaitingSince?.toISOString();
    dto.createdAt = conv.createdAt.toISOString();
    dto.updatedAt = conv.updatedAt.toISOString();
    return dto;
  }
}
