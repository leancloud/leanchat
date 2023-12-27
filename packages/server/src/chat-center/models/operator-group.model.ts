import { Index, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@Index({ operatorIds: 1 })
@ModelOptions({
  schemaOptions: {
    collection: 'operator_group',
    timestamps: true,
  },
})
export class OperatorGroup {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  name: string;

  @Prop({ type: Types.ObjectId })
  operatorIds: Types.ObjectId[];

  createdAt: Date;

  updatedAt: Date;
}
