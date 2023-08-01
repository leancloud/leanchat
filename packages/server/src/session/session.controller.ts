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

import { OperatorService } from '../operator/operator.service';
import { ICreateSession } from './interfaces';

@Controller('sessions')
export class SessionController {
  constructor(private operatorService: OperatorService) {}

  @Post()
  async createSession(@Req() req: Request, @TypedBody() data: ICreateSession) {
    const operator = await this.operatorService.getOperatorByUsername(
      data.username,
    );
    if (!operator) {
      throw new UnauthorizedException(`operator ${data.username} not exists`);
    }
    const passwordMatch = await this.operatorService.comparePassword(
      operator.password,
      data.password,
    );
    if (!passwordMatch) {
      throw new UnauthorizedException('username and password mismatch');
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
