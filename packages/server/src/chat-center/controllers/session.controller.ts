import { promisify } from 'node:util';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Post,
  Req,
  UsePipes,
} from '@nestjs/common';
import { Request } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';

import { Operator } from 'src/chat';
import { SessionService } from '../services';
import { OperatorDto } from '../dtos/operator';
import { CreateSessionDto } from '../dtos/create-session.dto';

@Controller('sessions')
@UsePipes(ZodValidationPipe)
export class SessionController {
  constructor(private sessionService: SessionService) {}

  @Post()
  async createSession(@Req() req: Request, @Body() data: CreateSessionDto) {
    let operator: Operator | null | undefined;

    if (data.username && data.password) {
      operator = await this.sessionService.createSessionByUsername(
        data.username,
        data.password,
      );
    } else if (data.token) {
      operator = await this.sessionService.createSessionByToken(data.token);
    } else {
      throw new BadRequestException('无效的登录凭证');
    }

    if (!operator) {
      throw new BadRequestException('登录失败');
    }
    if (operator.inactive) {
      throw new ForbiddenException('当前账户已被禁用');
    }

    await promisify(req.session.regenerate).call(req.session);
    req.session.uid = operator.id;

    return OperatorDto.fromDocument(operator);
  }

  @Delete('current')
  async deleteCurrentSession(@Req() req: Request) {
    await promisify(req.session.destroy).call(req.session);
  }
}
