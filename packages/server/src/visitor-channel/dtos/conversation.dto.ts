import { Conversation } from 'src/chat';

export class ConversationDto {
  id: string;

  status: number;

  evaluation?: Conversation['evaluation'];

  static fromDocument(conv: Conversation) {
    const dto = new ConversationDto();
    dto.id = conv.id;
    dto.status = conv.status;
    dto.evaluation = conv.evaluation;
    return dto;
  }
}
