import { Index, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

import { UserInfo } from './user-info.model';

class Evaluation {
  @Prop()
  star: number;

  @Prop()
  feedback: string;
}

class Stats {
  @Prop()
  visitorMessageCount?: number;

  @Prop()
  operatorMessageCount?: number;

  @Prop()
  firstResponseTime?: number;

  @Prop()
  responseTime?: number;

  @Prop()
  responseCount?: number;

  @Prop()
  averageResponseTime?: number;

  @Prop()
  receptionTime?: number;

  @Prop()
  openTime?: number;

  @Prop()
  firstOperatorJoinedAt?: Date;

  @Prop()
  joinedOperatorIds?: Types.ObjectId[];

  @Prop()
  firstOperatorMessageCreatedAt?: Date;

  @Prop()
  queueConnectionTime?: number;

  @Prop()
  queueTimeToLeave?: number;
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
  categoryId?: Types.ObjectId;

  @Prop({ _id: false })
  evaluation?: Evaluation;

  @Prop({ index: true })
  closedAt?: Date;

  @Prop({ _id: false })
  closedBy?: UserInfo;

  @Prop()
  queuedAt?: Date;

  @Prop()
  visitorLastActivityAt?: Date;

  @Prop()
  operatorLastActivityAt?: Date;

  @Prop()
  visitorWaitingSince?: Date;

  @Prop()
  inviteEvaluationAt?: Date;

  @Prop({ _id: false })
  stats?: Stats;

  createdAt: Date;

  updatedAt: Date;
}
