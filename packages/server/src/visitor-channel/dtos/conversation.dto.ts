import { Conversation } from 'src/chat';

export class ConversationDto {
  id: string;

  evaluation?: Conversation['evaluation'];

  static fromDocument(conv: Conversation) {
    const dto = new ConversationDto();
    dto.id = conv.id;
    dto.evaluation = conv.evaluation;
    return dto;
  }
}
