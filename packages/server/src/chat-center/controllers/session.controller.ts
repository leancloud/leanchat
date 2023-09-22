import { promisify } from 'node:util';
import {
  Body,
  Controller,
  Delete,
  Post,
  Req,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { Request } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';

import { ChatService, OperatorService } from 'src/chat';
import { OperatorDto } from '../dtos/operator';
import { CreateSessionDto } from '../dtos/create-session.dto';

@Controller('sessions')
@UsePipes(ZodValidationPipe)
export class SessionController {
  constructor(
    private operatorService: OperatorService,
    private chatService: ChatService,
  ) {}

  @Post()
  async createSession(@Req() req: Request, @Body() data: CreateSessionDto) {
    const operator = await this.operatorService.getOperatorByUsername(
      data.username,
      true,
    );
    if (!operator) {
      throw new UnauthorizedException(`客服 ${data.username} 不存在`);
    }
    if (!(await operator.comparePassword(data.password))) {
      throw new UnauthorizedException('用户名密码不匹配');
    }
    delete operator.password;

    await promisify(req.session.regenerate).call(req.session);
    req.session.uid = operator.id;

    const status = await this.chatService.getOperatorStatus(operator.id);

    const dto = OperatorDto.fromDocument(operator);
    dto.status = status;
    return dto;
  }

  @Delete('current')
  async deleteCurrentSession(@Req() req: Request) {
    await promisify(req.session.destroy).call(req.session);
  }
}
