import { Index, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@Index({ timestamp: 1, operatorId: 1 }, { unique: true })
@ModelOptions({
  schemaOptions: {
    collection: 'online_time',
  },
})
export class OnlineTime {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  timestamp: Date;

  @Prop()
  operatorId: Types.ObjectId;

  @Prop()
  status: string;
}
