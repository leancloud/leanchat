import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { TypedBody, TypedQuery } from '@nestia/core';
import { Response } from 'express';

import { IPagination } from 'src/interfaces';
import { AuthGuard } from 'src/auth/auth.guard';
import { ICreateOperator } from './interfaces';
import { OperatorService } from './operator.service';

@Controller('operators')
@UseGuards(AuthGuard)
export class OperatorController {
  constructor(private operatorService: OperatorService) {}

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
}
