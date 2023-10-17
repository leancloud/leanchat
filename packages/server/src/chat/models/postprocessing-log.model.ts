import { Index, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@Index({ startTime: 1, endTime: 1 })
@ModelOptions({
  schemaOptions: {
    collection: 'postprocessing_log',
    versionKey: false,
  },
})
export class PostprocessingLog {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  operatorId: Types.ObjectId;

  @Prop()
  startTime: Date;

  @Prop()
  endTime: Date;
}
