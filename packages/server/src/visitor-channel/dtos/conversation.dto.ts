import { Conversation } from 'src/chat';

export class ConversationDto {
  id: string;

  evaluation?: Conversation['evaluation'];

  closedAt?: string;

  static fromDocument(conv: Conversation) {
    const dto = new ConversationDto();
    dto.id = conv.id;
    dto.evaluation = conv.evaluation;
    dto.closedAt = conv.closedAt?.toISOString();
    return dto;
  }
}
