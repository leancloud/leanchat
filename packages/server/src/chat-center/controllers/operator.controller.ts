import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { Operator, OperatorService } from 'src/operator';
import { AuthGuard } from '../guards/auth.guard';
import { CurrentOperator } from '../decorators/current-operator.decorator';
import { ChatService } from '../chat.service';
import { OperatorDto } from '../dtos/operator.dto';
import { CreateOperatorDto } from '../dtos/create-operator.dto';
import { UpdateOperatorDto } from '../dtos/update-operator.dto';

@Controller('operators')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class OperatorController {
  constructor(
    private operatorService: OperatorService,
    private chatService: ChatService,
  ) {}

  @Post()
  createOperator(@Body() data: CreateOperatorDto) {
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
    @Body() data: UpdateOperatorDto,
  ) {
    await this.operatorService.updateOperator(id, data);
  }
}
