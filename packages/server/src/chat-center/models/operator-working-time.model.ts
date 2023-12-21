import { Index, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@Index({ operatorId: 1, startTime: 1 })
@ModelOptions({
  schemaOptions: {
    collection: 'operator_working_time',
    versionKey: false,
  },
})
export class OperatorWorkingTime {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  operatorId: Types.ObjectId;

  @Prop()
  startTime: Date;

  @Prop()
  endTime: Date;

  @Prop()
  duration: number;

  @Prop()
  status: number;

  @Prop()
  ip?: string;
}
