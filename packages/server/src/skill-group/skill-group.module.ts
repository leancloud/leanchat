import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { Module } from '@nestjs/common';

import { OperatorModule } from 'src/operator';
import { SkillGroup } from './skill-group.model';
import { SkillGroupService } from './skill-group.service';
@Module({
  imports: [TypegooseModule.forFeature([SkillGroup]), OperatorModule],
  providers: [SkillGroupService],
  exports: [SkillGroupService],
})
export class SkillGroupModule {}
