import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { hash, verify } from '@node-rs/argon2';
import AV from 'leancloud-storage';
import { Cache } from 'cache-manager';
import _ from 'lodash';

import { ICreateOperator, IUpdateOperator } from './interfaces';
import { Operator } from './operator.entity';

@Injectable()
export class OperatorService {
  @Inject(CACHE_MANAGER)
  private cache: Cache;

  async createOperator(data: ICreateOperator) {
    const existOperator = await this.getOperatorByUsername(data.username);
    if (existOperator) {
      throw new ConflictException(`已存在用户名为 ${data.username} 的客服`);
    }

    const hashedPassword = await hash(data.password);
    const obj = new AV.Object('ChatOperator', {
      username: data.username,
      password: hashedPassword,
      externalName: data.externalName,
      internalName: data.internalName,
      concurrency: data.concurrency,
    });
    await obj.save(null, { useMasterKey: true });
    return Operator.fromAVObject(obj);
  }

  private getOperatorObject(id: string) {
    const query = new AV.Query('ChatOperator');
    query.equalTo('objectId', id);
    return query.first({ useMasterKey: true }) as Promise<
      AV.Object | undefined
    >;
  }

  async getOperator(id: string) {
    const cacheKey = `operator:${id}`;
    const cacheValue = await this.cache.get<Operator>(cacheKey);
    if (cacheValue) {
      return cacheValue;
    }

    const obj = await this.getOperatorObject(id);
    if (obj) {
      const operator = Operator.fromAVObject(obj as AV.Object);
      await this.cache.set(cacheKey, operator);
      return operator;
    }
  }

  async getOperatorByUsername(username: string) {
    const query = new AV.Query('ChatOperator');
    query.equalTo('username', username);
    const obj = await query.first({ useMasterKey: true });
    return obj && Operator.fromAVObject(obj as AV.Object);
  }

  comparePassword(hashedPassword: string, password: string) {
    return verify(hashedPassword, password);
  }

  async getOperators() {
    const query = new AV.Query('ChatOperator');
    query.addAscending('createdAt');
    query.limit(1000);
    const objs = await query.find({ useMasterKey: true });
    return objs.map((obj) => Operator.fromAVObject(obj as AV.Object));
  }

  async updateOperator(id: string, data: IUpdateOperator) {
    const obj = await this.getOperatorObject(id);
    if (!obj) {
      throw new NotFoundException(`operator ${id} not exists`);
    }

    if (!_.isEmpty(data)) {
      if (data.password) {
        const hashedPassword = await hash(data.password);
        obj.set('password', hashedPassword);
      }
      if (data.externalName) {
        obj.set('externalName', data.externalName);
      }
      if (data.internalName) {
        obj.set('internalName', data.internalName);
      }
      if (data.concurrency !== undefined) {
        obj.set('concurrency', data.concurrency);
      }
      await obj.save(null, { useMasterKey: true });
    }

    return Operator.fromAVObject(obj);
  }
}
