import { ConversationDocument } from 'src/conversation';
import { IMessage } from 'src/interfaces';

export class ConversationDto {
  id: string;

  visitorId: string;

  operatorId?: string;

  lastMessage?: IMessage;

  status: string;

  evaluation?: {
    star: number;
    feedback: string;
  };

  categoryId?: string;

  createdAt: string;

  updatedAt: string;

  static fromDocument(conv: ConversationDocument) {
    const dto = new ConversationDto();
    dto.id = conv.id;
    dto.visitorId = conv.visitorId.toString();
    dto.operatorId = conv.operatorId?.toString();
    dto.lastMessage = conv.lastMessage;
    dto.status = conv.status;
    dto.evaluation = conv.evaluation;
    dto.categoryId = conv.categoryId?.toString();
    dto.createdAt = conv.createdAt.toISOString();
    dto.updatedAt = conv.updatedAt.toISOString();
    return dto;
  }
}
