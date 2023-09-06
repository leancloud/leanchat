import { QuickReply } from 'src/quick-reply';

export class QuickReplyDto {
  id: string;

  content: string;

  tags?: string[];

  createdAt: string;

  updatedAt: string;

  static fromDocument(quickReply: QuickReply) {
    const dto = new QuickReplyDto();
    dto.id = quickReply.id;
    dto.content = quickReply.content;
    dto.tags = quickReply.tags;
    dto.createdAt = quickReply.createdAt.toISOString();
    dto.updatedAt = quickReply.updatedAt.toISOString();
    return dto;
  }
}
