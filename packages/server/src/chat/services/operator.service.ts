import crypto from 'node:crypto';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { AnyKeys } from 'mongoose';
import { hash } from '@node-rs/argon2';

import { Operator } from '../models';
import { CreateOperatorData, UpdateOperatorData } from '../interfaces';
import { OperatorStatus } from '../constants';

@Injectable()
export class OperatorService implements OnApplicationBootstrap {
  @InjectModel(Operator)
  private operatorModel: ReturnModelType<typeof Operator>;

  private generateRandomPassword(length: number) {
    if (length <= 0) {
      throw new Error('Password length must be greater than 0');
    }

    // Define the character set for the password
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';

    // Create a buffer to store random bytes
    const randomBytes = crypto.randomBytes(length);

    // Initialize an empty password string
    let password = '';

    for (let i = 0; i < length; i++) {
      // Generate a random index within the charset length
      const randomIndex = randomBytes[i] % charset.length;

      // Append the character at the random index to the password
      password += charset[randomIndex];
    }

    return password;
  }

  onApplicationBootstrap() {
    this.createDefaultOperator();
  }

  async createOperator(data: CreateOperatorData) {
    const operator = new this.operatorModel({
      username: data.username,
      internalName: data.internalName,
      externalName: data.externalName,
      concurrency: data.concurrency,
    });
    await operator.setPassword(data.password);
    return operator.save();
  }

  getOperator(id: string) {
    return this.operatorModel.findById(id).exec();
  }

  getOperators(ids?: string[]) {
    if (ids) {
      return this.operatorModel.find({
        _id: { $in: ids },
      });
    }
    return this.operatorModel.find().exec();
  }

  getReadyOperators() {
    return this.operatorModel.find({ status: OperatorStatus.Ready }).exec();
  }

  getOperatorByUsername(username: string, selectPassword?: boolean) {
    const query = this.operatorModel.findOne({ username });
    if (selectPassword) {
      query.select('password');
    }
    return query.exec();
  }

  async createDefaultOperator() {
    const existAdmin = await this.getOperatorByUsername('admin');
    if (existAdmin) {
      return;
    }

    const admin = new this.operatorModel({
      username: 'admin',
      externalName: '管理员',
      internalName: '管理员',
      concurrency: 0,
    });
    const password = this.generateRandomPassword(16);
    await admin.setPassword(password);

    try {
      await admin.save();
      console.log('admin account created', {
        username: admin.username,
        password,
      });
    } catch {}
  }

  async updateOperator(operatorId: string, data: UpdateOperatorData) {
    const $set: AnyKeys<Operator> = {
      externalName: data.externalName,
      internalName: data.internalName,
      concurrency: data.concurrency,
      workload: data.workload,
      status: data.status,
      statusUpdatedAt: data.statusUpdatedAt,
    };

    if (data.password) {
      $set.password = await hash(data.password);
    }
    if (data.status !== undefined && !data.statusUpdatedAt) {
      $set.statusUpdatedAt = new Date();
    }

    return this.operatorModel
      .findOneAndUpdate({ _id: operatorId }, { $set }, { new: true })
      .exec();
  }

  async increaseOperatorWorkload(operatorId: string, value: number) {
    await this.operatorModel.updateOne(
      { _id: operatorId },
      {
        $inc: {
          workload: value,
        },
      },
    );
  }
}
