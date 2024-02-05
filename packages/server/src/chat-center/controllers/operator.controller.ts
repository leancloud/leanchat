import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseBoolPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ZodValidationPipe } from 'nestjs-zod';

import {
  ChatService,
  Operator,
  OperatorDeactivatedEvent,
  OperatorService,
} from 'src/chat';
import { AuthGuard } from '../guards/auth.guard';
import { CurrentOperator } from '../decorators/current-operator.decorator';
import {
  OperatorDto,
  CreateOperatorDto,
  UpdateOperatorDto,
  SetStatusDto,
} from '../dtos/operator';

@Controller('operators')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class OperatorController {
  constructor(
    private events: EventEmitter2,
    private operatorService: OperatorService,
    private chatService: ChatService,
  ) {}

  @Post()
  async createOperator(@Body() data: CreateOperatorDto) {
    const operator = await this.operatorService.createOperator(data);
    return OperatorDto.fromDocument(operator);
  }

  @Get()
  async getOperators(
    @Query('inactive', new ParseBoolPipe({ optional: true }))
    inactive?: boolean,
  ) {
    const operators = await this.operatorService.getOperators({ inactive });
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
    if (data.inactive) {
      this.events.emit('operator.deactivated', {
        operatorId: operator.id,
      } satisfies OperatorDeactivatedEvent);
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
