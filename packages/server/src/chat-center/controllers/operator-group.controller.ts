import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { OperatorRole } from 'src/chat/constants';
import { AuthGuard, RolesGuard } from '../guards';
import {
  OperatorGroupDto,
  CreateOperatorGroupDto,
  UpdateOperatorGroupDto,
} from '../dtos/operator-group';
import { OperatorGroupService } from '../services';
import { Roles } from '../decorators';

@Controller('operator-groups')
@UseGuards(AuthGuard, RolesGuard)
@UsePipes(ZodValidationPipe)
export class OperatorGroupController {
  constructor(private operatorGroupService: OperatorGroupService) {}

  @Post()
  @Roles(OperatorRole.Admin)
  async create(@Body() data: CreateOperatorGroupDto) {
    const group = await this.operatorGroupService.create(data);
    return OperatorGroupDto.fromDocument(group);
  }

  @Get()
  async list() {
    const groups = await this.operatorGroupService.list();
    return groups.map(OperatorGroupDto.fromDocument);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const group = await this.operatorGroupService.get(id);
    if (!group) {
      throw new NotFoundException('客服组不存在');
    }
    return OperatorGroupDto.fromDocument(group);
  }

  @Patch(':id')
  @Roles(OperatorRole.Admin)
  async update(@Param('id') id: string, @Body() data: UpdateOperatorGroupDto) {
    const group = await this.operatorGroupService.update(id, data);
    if (!group) {
      throw new NotFoundException('客服组不存在');
    }
    return OperatorGroupDto.fromDocument(group);
  }

  @Delete(':id')
  @Roles(OperatorRole.Admin)
  async delete(@Param('id') id: string) {
    const group = await this.operatorGroupService.delete(id);
    if (!group) {
      throw new NotFoundException('客服组不存在');
    }
  }
}
