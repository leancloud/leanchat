import { Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

import { UserType } from '../constants';

export class UserInfo {
  @Prop({ enum: UserType })
  type: UserType;

  @Prop()
  id?: Types.ObjectId;
}
