import { Operator } from 'src/chat';

export class OperatorDto {
  id: string;

  username: string;

  externalName: string;

  internalName: string;

  concurrency: number;

  status?: string;

  static fromDocument(operator: Operator) {
    const dto = new OperatorDto();
    dto.id = operator.id;
    dto.username = operator.username;
    dto.externalName = operator.externalName;
    dto.internalName = operator.internalName;
    dto.concurrency = operator.concurrency;
    return dto;
  }
}
