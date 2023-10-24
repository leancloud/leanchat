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

import { ChatService, Operator, OperatorRole, OperatorService } from 'src/chat';
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
    const operator = await this.operatorService.createOperator({
      ...data,
      role: OperatorRole.Operator,
    });
    return OperatorDto.fromDocument(operator);
  }

  @Get()
  async getOperators() {
    const operators = await this.operatorService.getOperators();
    return operators.map(OperatorDto.fromDocument);
  }

  @Get('me')
  getCurrentOperator(@CurrentOperator() operator: Operator) {
    return OperatorDto.fromDocument(operator);
  }

  @Get(':id')
  async getOperator(@Param('id') id: string) {
    const operator = await this.operatorService.getOperator(id);
    if (!operator) {
      throw new NotFoundException(`客服 ${id} 不存在`);
    }
    return OperatorDto.fromDocument(operator);
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
    return OperatorDto.fromDocument(operator);
  }

  @Post('me/setStatus')
  async setCurrentOperatorStatus(
    @CurrentOperator() operator: Operator,
    @Body() data: SetStatusDto,
  ) {
    await this.chatService.setOperatorStatus(operator.id, data.status);
  }
}
