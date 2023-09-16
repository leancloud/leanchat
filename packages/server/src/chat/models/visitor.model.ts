import { Index, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@Index({ channel: 1, channelId: 1 })
@Index({ createdAt: 1 })
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
