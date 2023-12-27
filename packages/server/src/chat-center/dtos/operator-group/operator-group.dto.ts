import { OperatorGroup } from '../../models';

export class OperatorGroupDto {
  id: string;

  name: string;

  operatorIds: string[];

  createdAt: string;

  updatedAt: string;

  static fromDocument(group: OperatorGroup) {
    const dto = new OperatorGroupDto();
    dto.id = group.id ?? group._id.toHexString();
    dto.name = group.name;
    dto.operatorIds = group.operatorIds.map((id) => id.toHexString());
    dto.createdAt = group.createdAt.toISOString();
    dto.updatedAt = group.updatedAt.toISOString();
    return dto;
  }
}
