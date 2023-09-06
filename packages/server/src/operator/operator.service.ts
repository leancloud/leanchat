import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { ICreateOperator, IUpdateOperator } from './interfaces';
import { Operator } from './operator.model';

@Injectable()
export class OperatorService {
  @InjectModel(Operator)
  private operatorModel: ReturnModelType<typeof Operator>;

  async createOperator(data: ICreateOperator) {
    const existOperator = await this.getOperatorByUsername(data.username);
    if (existOperator) {
      throw new ConflictException(`已存在用户名为 ${data.username} 的客服`);
    }

    const hashedPassword = await hash(data.password);
    const operator = new this.operatorModel({
      username: data.username,
      password: hashedPassword,
      externalName: data.externalName,
      internalName: data.internalName,
      concurrency: data.concurrency,
    });
    return operator.save();
  }

  getOperator(id: string) {
    return this.operatorModel.findById(id);
  }

  getOperatorByUsername(username: string, selectPassword?: boolean) {
    const query = this.operatorModel.findOne({ username });
    if (selectPassword) {
      query.select('password');
    }
    return query.exec();
  }

  comparePassword(hashedPassword: string, password: string) {
    return verify(hashedPassword, password);
  }

  getOperators() {
    return this.operatorModel.find();
  }

  async updateOperator(id: string, data: IUpdateOperator) {
    const operator = await this.getOperator(id);
    if (!operator) {
      throw new NotFoundException(`operator ${id} not exists`);
    }

    if (data.password) {
      const hashedPassword = await hash(data.password);
      operator.set('password', hashedPassword);
    }
    if (data.externalName) {
      operator.set('externalName', data.externalName);
    }
    if (data.internalName) {
      operator.set('internalName', data.internalName);
    }
    if (data.concurrency !== undefined) {
      operator.set('concurrency', data.concurrency);
    }

    return operator.save();
  }
}
