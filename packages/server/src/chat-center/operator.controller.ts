import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TypedBody } from '@nestia/core';

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
  async getOperators() {
    const operators = await this.operatorService.getOperators();
    const statuses = await this.chatService.getOperatorStatuses();
    return operators.map((operator) => {
      const dto = OperatorDto.fromEntity(operator);
      dto.status = statuses[operator.id] || 'leave';
      return dto;
    });
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
    const dto = OperatorDto.fromEntity(operator);
    dto.status = await this.chatService.getOperatorStatus(operator.id);
    return dto;
  }

  @Patch(':id')
  async updateOperator(
    @Param('id') id: string,
    @TypedBody() data: IUpdateOperator,
  ) {
    await this.operatorService.updateOperator(id, data);
  }
}
