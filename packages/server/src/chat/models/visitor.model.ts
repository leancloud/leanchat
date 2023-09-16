import { ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@ModelOptions({
  schemaOptions: {
    collection: 'visitor',
    timestamps: true,
  },
})
export class Visitor {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  channel: string;

  @Prop()
  channelId: string;

  createdAt: Date;

  updatedAt: Date;
}
