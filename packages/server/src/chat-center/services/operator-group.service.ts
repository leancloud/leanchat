import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { AnyKeys } from 'mongoose';

import { OperatorService } from 'src/chat/services';
import { OperatorGroup } from '../models';
import {
  CreateOperatorGroupData,
  UpdateOperatorGroupData,
} from '../interfaces';

@Injectable()
export class OperatorGroupService {
  @InjectModel(OperatorGroup)
  private OperatorGroup: ReturnModelType<typeof OperatorGroup>;

  constructor(private operatorService: OperatorService) {}

  async create(data: CreateOperatorGroupData) {
    const group = new this.OperatorGroup({
      name: data.name,
      operatorIds: [],
    });
    if (data.operatorIds?.length) {
      const operators = await this.operatorService.getOperators({
        ids: data.operatorIds,
      });
      group.operatorIds = operators.map((o) => o._id);
    }
    return group.save();
  }

  list() {
    return this.OperatorGroup.find().limit(1000).exec();
  }

  get(id: string) {
    return this.OperatorGroup.findById(id).exec();
  }

  async update(id: string, data: UpdateOperatorGroupData) {
    const $set: AnyKeys<OperatorGroup> = {};
    if (data.name) {
      $set.name = data.name;
    }
    if (data.operatorIds) {
      const operators = await this.operatorService.getOperators({
        ids: data.operatorIds,
      });
      $set.operatorIds = operators.map((o) => o._id);
    }
    return this.OperatorGroup.findByIdAndUpdate(
      id,
      { $set },
      { new: true },
    ).exec();
  }

  delete(id: string) {
    return this.OperatorGroup.findByIdAndDelete(id).exec();
  }
}
