import { Operator } from 'src/operator';

export class OperatorDto {
  id: string;

  username: string;

  externalName: string;

  internalName: string;

  concurrency: number;

  status?: string;

  static fromEntity(operator: Operator) {
    const dto = new OperatorDto();
    dto.id = operator.id;
    dto.username = operator.username;
    dto.externalName = operator.externalName;
    dto.internalName = operator.internalName;
    dto.concurrency = operator.concurrency;
    return dto;
  }
}
