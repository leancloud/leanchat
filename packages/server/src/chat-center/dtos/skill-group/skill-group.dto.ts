import { SkillGroup } from 'src/skill-group';

export class SkillGroupDto {
  id: string;

  name: string;

  memberIds: string[];

  createdAt: string;

  updatedAt: string;

  static fromDocument(group: SkillGroup) {
    const dto = new SkillGroupDto();
    dto.id = group.id;
    dto.name = group.name;
    dto.memberIds = group.memberIds.map((id) => id.toString());
    dto.createdAt = group.createdAt.toISOString();
    dto.updatedAt = group.updatedAt.toISOString();
    return dto;
  }
}
