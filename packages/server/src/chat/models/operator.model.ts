import { ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { hash, verify } from '@node-rs/argon2';

import { OperatorStatus } from '../constants';

@ModelOptions({
  schemaOptions: {
    collection: 'operator',
    timestamps: true,
  },
})
export class Operator {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  username: string;

  @Prop({ select: false })
  password?: string;

  @Prop()
  externalName: string;

  @Prop()
  internalName: string;

  @Prop()
  concurrency: number;

  @Prop()
  workload?: number;

  @Prop({ enum: OperatorStatus })
  status?: OperatorStatus;

  createdAt: Date;

  updatedAt: Date;

  async setPassword(password: string) {
    this.password = await hash(password);
  }

  comparePassword(password: string) {
    if (!this.password) {
      throw new Error('password is undefined');
    }
    return verify(this.password, password);
  }
}
