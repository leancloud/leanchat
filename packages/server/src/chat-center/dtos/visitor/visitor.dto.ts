import { Visitor } from 'src/chat';

export class VisitorDto {
  id: string;

  name?: string;

  comment?: string;

  createdAt: string;

  updatedAt: string;

  static fromDocument(visitor: Visitor) {
    const dto = new VisitorDto();
    dto.id = visitor.id ?? visitor._id.toHexString();
    dto.name = visitor.name;
    dto.comment = visitor.comment;
    dto.createdAt = visitor.createdAt.toISOString();
    dto.updatedAt = visitor.updatedAt.toISOString();
    return dto;
  }
}
