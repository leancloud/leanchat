import { Index, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

class Evaluation {
  @Prop()
  star: number;

  @Prop()
  feedback: string;
}

@Index({ visitorId: 1 })
@Index({ createdAt: 1 })
@ModelOptions({
  schemaOptions: {
    collection: 'conversation',
    timestamps: true,
  },
})
export class Conversation {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  channel: string;

  @Prop()
  visitorId: Types.ObjectId;

  @Prop()
  operatorId?: Types.ObjectId;

  @Prop()
  evaluation?: Evaluation;

  @Prop()
  closedAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}
