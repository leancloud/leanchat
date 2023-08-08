import { promisify } from 'node:util';
import {
  Controller,
  Delete,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { TypedBody } from '@nestia/core';
import { Request } from 'express';

import { OperatorService } from 'src/operator';
import { ICreateSession } from './interfaces/session';

@Controller('sessions')
export class SessionController {
  constructor(private operatorService: OperatorService) {}

  @Post()
  async createSession(@Req() req: Request, @TypedBody() data: ICreateSession) {
    const operator = await this.operatorService.getOperatorByUsername(
      data.username,
    );
    if (!operator) {
      throw new UnauthorizedException(`客服 ${data.username} 不存在`);
    }
    const passwordMatch = await this.operatorService.comparePassword(
      operator.password,
      data.password,
    );
    if (!passwordMatch) {
      throw new UnauthorizedException('用户名密码不匹配');
    }

    await promisify(req.session.regenerate).call(req.session);
    req.session.uid = operator.id;

    return operator;
  }

  @Delete('current')
  async deleteCurrentSession(@Req() req: Request) {
    await promisify(req.session.destroy).call(req.session);
  }
}
