import { Index, ModelOptions, Prop, Severity } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { UserInfo } from './user-info.model';

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

  @Prop({ _id: false })
  from: UserInfo;

  @Prop()
  type: string;

  @Prop()
  data: any;

  createdAt: Date;

  updatedAt: Date;
}
