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
    feedback?: string;
    tags?: string[];
  };

  evaluationInvitedAt?: string;

  visitorWaitingSince?: string;

  createdAt: string;

  updatedAt: string;

  queuedAt?: string;

  closedAt?: string;

  closedBy?: {
    type: number;
    id?: string;
  };

  lastMessage?: any;

  visitor?: VisitorDto;

  joinedOperatorIds?: string[];

  stats?: Record<string, any>;

  static fromDocument(conv: Conversation) {
    const dto = new ConversationDto();
    dto.id = conv.id ?? conv._id.toHexString();
    dto.status = conv.status;
    dto.visitorId = conv.visitorId.toString();
    dto.operatorId = conv.operatorId?.toString();
    dto.categoryId = conv.categoryId?.toString();
    dto.evaluation = conv.evaluation;
    dto.evaluationInvitedAt = conv.evaluationInvitedAt?.toISOString();
    dto.visitorWaitingSince = conv.visitorWaitingSince?.toISOString();
    dto.createdAt = conv.createdAt.toISOString();
    dto.updatedAt = conv.updatedAt.toISOString();
    dto.queuedAt = conv.queuedAt?.toISOString();
    dto.closedAt = conv.closedAt?.toISOString();
    dto.closedBy = conv.closedBy && {
      type: conv.closedBy.type,
      id: conv.closedBy.id?.toHexString(),
    };
    dto.stats = conv.stats;
    return dto;
  }
}
