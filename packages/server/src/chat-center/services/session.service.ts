import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'jsonwebtoken';
import { z } from 'zod';
import _ from 'lodash';

import { OperatorService } from 'src/chat/services';
import { Operator } from 'src/chat/models';
import { UpdateOperatorData } from 'src/chat/interfaces';
import { OperatorRole } from 'src/chat/constants';
import { CreateOperatorSchema } from '../dtos/operator';

const JwtSchema = CreateOperatorSchema.omit({ password: true })
  .partial()
  .required({ username: true })
  .extend({ sync: z.boolean().optional() });

@Injectable()
export class SessionService {
  private tokenSecret: string;

  constructor(
    private operatorService: OperatorService,
    configService: ConfigService,
  ) {
    this.tokenSecret = configService.getOrThrow('LEANCHAT_LOGIN_JWT_SECRET');
  }

  async createSessionByUsername(username: string, password: string) {
    const operator = await this.operatorService.getOperatorByUsername(
      username,
      true,
    );
    if (!operator) {
      throw new UnauthorizedException(`客服 ${username} 不存在`);
    }
    if (!(await operator.comparePassword(password))) {
      throw new UnauthorizedException('用户名密码不匹配');
    }
    delete operator.password;
    return operator;
  }

  private validateToken(token: string) {
    try {
      const payload = verify(token, this.tokenSecret, {
        maxAge: 60 * 5, // 5 mins
      });
      return JwtSchema.parse(payload);
    } catch {
      throw new BadRequestException('无效的登录凭证');
    }
  }

  private syncOperatorData(
    operator: Operator,
    data: z.infer<typeof JwtSchema>,
  ) {
    const updateData: UpdateOperatorData = {};
    if (data.role !== undefined && operator.role !== data.role) {
      updateData.role = data.role;
    }
    if (
      data.externalName !== undefined &&
      operator.externalName !== data.externalName
    ) {
      updateData.externalName = data.externalName;
    }
    if (
      data.internalName !== undefined &&
      operator.internalName !== data.internalName
    ) {
      updateData.internalName = data.internalName;
    }
    if (
      data.concurrency !== undefined &&
      operator.concurrency !== data.concurrency
    ) {
      updateData.concurrency = data.concurrency;
    }
    if (_.isEmpty(updateData)) {
      return operator;
    }
    return this.operatorService.updateOperator(operator.id, updateData);
  }

  async createSessionByToken(token: string) {
    const data = this.validateToken(token);
    let operator = await this.operatorService.getOperatorByUsername(
      data.username,
    );
    if (!operator) {
      operator = await this.operatorService.createOperator({
        role: data.role ?? OperatorRole.Operator,
        username: data.username,
        password: this.operatorService.generateRandomPassword(16),
        externalName: data.externalName ?? data.username,
        internalName: data.internalName ?? data.username,
        concurrency: data.concurrency,
      });
    }
    return data.sync ? this.syncOperatorData(operator, data) : operator;
  }
}
