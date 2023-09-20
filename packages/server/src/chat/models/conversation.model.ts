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

  @Prop({ _id: false })
  evaluation?: Evaluation;

  @Prop({ index: true })
  closedAt?: Date;

  @Prop()
  queuedAt?: Date;

  @Prop()
  visitorLastActivityAt?: Date;

  @Prop()
  operatorLastActivityAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}
