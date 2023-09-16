import { Index, ModelOptions, Prop, Severity } from '@typegoose/typegoose';
import { Types } from 'mongoose';

class MessageFrom {
  @Prop()
  type: 'visitor' | 'operator';

  @Prop()
  id: Types.ObjectId;
}

@Index({ visitorId: 1 })
@Index({ conversationId: 1 })
@Index({ createdAt: 1 })
@ModelOptions({
  schemaOptions: {
    collection: 'message',
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class Message {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  visitorId: Types.ObjectId;

  @Prop()
  conversationId: Types.ObjectId;

  @Prop()
  from: MessageFrom;

  @Prop()
  type: string;

  @Prop()
  data: any;

  createdAt: Date;

  updatedAt: Date;
}
