import { Injectable } from '@nestjs/common';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { OperatorService } from 'src/operator';
import { SkillGroup, SkillGroupDocument } from './skill-group.model';
import { CreateSkillGroupData, UpdateSkillGroupData } from './interfaces';

@Injectable()
export class SkillGroupService {
  @InjectModel(SkillGroup)
  private skillGroupModel: ReturnModelType<typeof SkillGroup>;

  constructor(private operatorService: OperatorService) {}

  private async setMemberIds(group: SkillGroup, memberIds: string[]) {
    const operators = await this.operatorService.getOperators({
      ids: memberIds,
    });
    group.memberIds = operators.map((o) => o._id);
  }

  async createSkillGroup(data: CreateSkillGroupData) {
    const group = new this.skillGroupModel();
    group.name = data.name;
    if (data.memberIds) {
      await this.setMemberIds(group, data.memberIds);
    }
    return group.save();
  }

  getSkillGroups() {
    return this.skillGroupModel.find();
  }

  getSkillGroup(id: string) {
    return this.skillGroupModel.findById(id);
  }

  async updateSkillGroup(
    group: SkillGroupDocument,
    data: UpdateSkillGroupData,
  ) {
    if (data.name) {
      group.name = data.name;
    }
    if (data.memberIds) {
      await this.setMemberIds(group, data.memberIds);
    }

    return group.save();
  }
}
