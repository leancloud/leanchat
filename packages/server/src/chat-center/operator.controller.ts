import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { TypedBody, TypedQuery } from '@nestia/core';
import { Response } from 'express';

import { IPagination } from 'src/interfaces';
import { Operator, OperatorService } from 'src/operator';
import { AuthGuard } from './guards/auth.guard';
import { CurrentOperator } from './decorators/current-operator.decorator';
import { ICreateOperator, IUpdateOperator } from './interfaces/operator';
import { ChatService } from './chat.service';
import { OperatorDto } from './dtos/operator.dto';

@Controller('operators')
@UseGuards(AuthGuard)
export class OperatorController {
  constructor(
    private operatorService: OperatorService,
    private chatService: ChatService,
  ) {}

  @Post()
  createOperator(@TypedBody() data: ICreateOperator) {
    return this.operatorService.createOperator(data);
  }

  @Get()
  async listOperators(
    @Res({ passthrough: true }) res: Response,
    @TypedQuery() query: IPagination,
  ) {
    const { operators, count } = await this.operatorService.listOperators(
      query,
    );
    res.set('x-total-count', count.toString());
    return operators;
  }

  @Get('me')
  async getCurrentOperator(@CurrentOperator() operator: Operator) {
    const dto = OperatorDto.fromEntity(operator);
    dto.status = await this.chatService.getOperatorStatus(operator.id);
    return dto;
  }

  @Get(':id')
  async getOperator(@Param('id') id: string) {
    const operator = await this.operatorService.getOperator(id);
    if (!operator) {
      throw new NotFoundException(`客服 ${id} 不存在`);
    }
    return operator;
  }

  @Patch(':id')
  updateOperator(@Param('id') id: string, @TypedBody() data: IUpdateOperator) {
    return this.operatorService.updateOperator(id, data);
  }
}
