import crypto from 'node:crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import {
  GetOperatorsOptions,
  ICreateOperator,
  IUpdateOperator,
} from './interfaces';
import { Operator } from './operator.model';

@Injectable()
export class OperatorService implements OnApplicationBootstrap {
  @InjectModel(Operator)
  private operatorModel: ReturnModelType<typeof Operator>;

  private generateRandomPassword(length: number) {
    if (length <= 0) {
      throw new Error('Password length must be greater than 0');
    }

    // Define the character set for the password
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';

    // Create a buffer to store random bytes
    const randomBytes = crypto.randomBytes(length);

    // Initialize an empty password string
    let password = '';

    for (let i = 0; i < length; i++) {
      // Generate a random index within the charset length
      const randomIndex = randomBytes[i] % charset.length;

      // Append the character at the random index to the password
      password += charset[randomIndex];
    }

    return password;
  }

  onApplicationBootstrap() {
    this.createDefaultOperator();
  }

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

  async createDefaultOperator() {
    const existAdmin = await this.getOperatorByUsername('admin');
    if (existAdmin) {
      return;
    }

    const password = this.generateRandomPassword(10);
    const hashedPassword = await hash(password);
    const admin = new this.operatorModel({
      username: 'admin',
      password: hashedPassword,
      externalName: '管理员',
      internalName: '管理员',
      concurrency: 0,
    });
    try {
      await admin.save();
      console.log('admin account created', {
        username: admin.username,
        password,
      });
    } catch {}
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

  getOperators({ ids }: GetOperatorsOptions = {}) {
    const query = this.operatorModel.find();
    if (ids) {
      query.in('_id', ids);
    }
    return query.exec();
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
