import { Index, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@Index({ conversationId: 1 }, { unique: true })
@ModelOptions({
  schemaOptions: {
    collection: 'conversation_stats',
  },
})
export class ConversationStats {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  conversationId: Types.ObjectId;

  @Prop()
  visitorMessageCount?: number;

  @Prop()
  operatorMessageCount?: number;

  @Prop()
  operatorJoinedAt?: Date;

  @Prop()
  firstOperatorMessageAt?: Date;

  @Prop()
  queuedAt?: Date;

  @Prop()
  closedAt?: Date;

  @Prop()
  firstResponseTime?: number;

  @Prop()
  totalResponseTime?: number;

  @Prop()
  totalResponseCount?: number;

  @Prop()
  operatorIds?: Types.ObjectId[];

  @Prop()
  receptionTime?: number;
}
