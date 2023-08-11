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

import { OperatorService } from 'src/operator';
import { ChatService } from './chat.service';
import { OperatorDto } from './dtos/operator.dto';
import { CreateSessionDto } from './dtos/create-session.dto';

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

    const operatorDto = OperatorDto.fromEntity(operator);
    operatorDto.status = await this.chatService.getOperatorStatus(operator.id);

    return operatorDto;
  }

  @Delete('current')
  async deleteCurrentSession(@Req() req: Request) {
    await promisify(req.session.destroy).call(req.session);
  }
}
