import { Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

export class UserInfo {
  @Prop()
  type: string;

  @Prop()
  id: Types.ObjectId;
}
