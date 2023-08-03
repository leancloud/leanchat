import AV from 'leancloud-storage';
import { Exclude } from 'class-transformer';

export class Operator {
  id: string;

  username: string;

  @Exclude()
  password: string;

  externalName: string;

  internalName: string;

  concurrency: number;

  static fromAVObject(obj: AV.Object) {
    const json = obj.toJSON();
    const operator = new Operator();
    operator.id = json.objectId;
    operator.username = json.username;
    operator.password = json.password;
    operator.internalName = json.internalName;
    operator.externalName = json.externalName;
    operator.concurrency = json.concurrency;
    return operator;
  }
}
