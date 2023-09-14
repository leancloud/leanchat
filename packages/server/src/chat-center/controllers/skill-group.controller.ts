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

import { SkillGroupService } from 'src/skill-group';
import { AuthGuard } from '../guards/auth.guard';
import {
  CreateSkillGroupDto,
  SkillGroupDto,
  UpdateSkillGroupDto,
} from '../dtos/skill-group';

@Controller('skill-groups')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class SkillGroupController {
  constructor(private skillGroupService: SkillGroupService) {}

  @Post()
  async createSkillGroup(@Body() data: CreateSkillGroupDto) {
    const group = await this.skillGroupService.createSkillGroup(data);
    return SkillGroupDto.fromDocument(group);
  }

  @Get()
  async getSkillGroups() {
    const groups = await this.skillGroupService.getSkillGroups();
    return groups.map(SkillGroupDto.fromDocument);
  }

  @Get(':id')
  async getSkillGroup(@Param('id') id: string) {
    const group = await this.skillGroupService.getSkillGroup(id);
    if (!group) {
      throw new NotFoundException(`技能组 ${id} 不存在`);
    }
    return SkillGroupDto.fromDocument(group);
  }

  @Patch(':id')
  async updateSkillGroup(
    @Param('id') id: string,
    @Body() data: UpdateSkillGroupDto,
  ) {
    const group = await this.skillGroupService.getSkillGroup(id);
    if (!group) {
      throw new NotFoundException('技能组不存在');
    }
    await this.skillGroupService.updateSkillGroup(group, data);
    return SkillGroupDto.fromDocument(group);
  }
}
