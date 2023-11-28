import { Index, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@Index({ timestamp: 1, operatorId: 1 }, { unique: true })
@ModelOptions({
  schemaOptions: {
    collection: 'operator_online_record',
    versionKey: false,
  },
})
export class OperatorOnlineRecord {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  timestamp: Date;

  @Prop()
  operatorId: Types.ObjectId;

  @Prop()
  status: number;
}
