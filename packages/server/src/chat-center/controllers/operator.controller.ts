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

import { ChatService, Operator, OperatorService } from 'src/chat';
import { AuthGuard } from '../guards/auth.guard';
import { CurrentOperator } from '../decorators/current-operator.decorator';
import { OperatorDto, SetStatusDto } from '../dtos/operator';
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
  async createOperator(@Body() data: CreateOperatorDto) {
    const operator = await this.operatorService.createOperator(data);
    const dto = OperatorDto.fromDocument(operator);
    dto.status = 'leave';
    return dto;
  }

  @Get()
  async getOperators() {
    const operators = await this.operatorService.getOperators();
    const statuses = await this.chatService.getOperatorStatuses(
      operators.map((o) => o.id),
    );
    return operators.map((operator) => {
      const dto = OperatorDto.fromDocument(operator);
      dto.status = statuses[operator.id] || 'leave';
      return dto;
    });
  }

  @Get('me')
  async getCurrentOperator(@CurrentOperator() operator: Operator) {
    const status = await this.chatService.getOperatorStatus(operator.id);
    const dto = OperatorDto.fromDocument(operator);
    dto.status = status || 'leave';
    return dto;
  }

  @Get(':id')
  async getOperator(@Param('id') id: string) {
    const operator = await this.operatorService.getOperator(id);
    if (!operator) {
      throw new NotFoundException(`客服 ${id} 不存在`);
    }
    const status = await this.chatService.getOperatorStatus(operator.id);
    const dto = OperatorDto.fromDocument(operator);
    dto.status = status || 'leave';
    return dto;
  }

  @Patch(':id')
  async updateOperator(
    @Param('id') id: string,
    @Body() data: UpdateOperatorDto,
  ) {
    const operator = await this.operatorService.updateOperator(id, data);
    if (!operator) {
      throw new NotFoundException(`Operator ${id} does not exist`);
    }
    const status = await this.chatService.getOperatorStatus(operator.id);
    const dto = OperatorDto.fromDocument(operator);
    dto.status = status || 'leave';
    return dto;
  }

  @Post('me/setStatus')
  async setCurrentOperatorStatus(
    @CurrentOperator() operator: Operator,
    @Body() data: SetStatusDto,
  ) {
    await this.chatService.setOperatorStatus(operator.id, data.status);
  }
}
