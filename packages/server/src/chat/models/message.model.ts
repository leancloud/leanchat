import { Index, ModelOptions, Prop, Severity } from '@typegoose/typegoose';
import { Types } from 'mongoose';

import { MessageType } from '../constants';
import { UserInfo } from './user-info.model';

@Index({ visitorId: 1 })
// `createdAt: -1` for finding last message
@Index({ conversationId: 1, createdAt: -1 })
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

  @Prop({ enum: MessageType })
  type: MessageType;

  @Prop()
  data: any;

  createdAt: Date;

  updatedAt: Date;
}
