import { ConflictException, Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import AV from 'leancloud-storage';

import { IPagination } from 'src/interfaces';
import { ICreateOperator } from './interfaces';
import { Operator } from './operator.entity';

@Injectable()
export class OperatorService {
  async createOperator(data: ICreateOperator) {
    const existOperator = await this.getOperatorByUsername(data.username);
    if (existOperator) {
      throw new ConflictException(`operator ${data.username} exists`);
    }

    const hashedPassword = await hash(data.password);
    const obj = new AV.Object('ChatOperator', {
      username: data.username,
      password: hashedPassword,
      externalName: data.externalName,
      internalName: data.internalName,
      maxCustomerCount: data.maxCustomerCount,
    });
    await obj.save(null, { useMasterKey: true });
    return Operator.fromAVObject(obj);
  }

  async getOperatorByUsername(username: string) {
    const query = new AV.Query('ChatOperator');
    query.equalTo('username', username);
    const obj = await query.first({ useMasterKey: true });
    if (obj) {
      return Operator.fromAVObject(obj as AV.Object);
    }
  }

  comparePassword(hashedPassword: string, password: string) {
    return verify(hashedPassword, password);
  }

  async listOperators({ page = 1, pageSize = 10 }: IPagination) {
    const query = new AV.Query('ChatOperator');
    query.addAscending('createdAt');
    query.skip((page - 1) * pageSize);
    query.limit(pageSize);
    const [objs, count] = await query.findAndCount({ useMasterKey: true });
    const operators = objs.map((obj) =>
      Operator.fromAVObject(obj as AV.Object),
    );
    return { operators, count };
  }
}
