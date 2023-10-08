import { Types } from 'mongoose';

export interface UserInfo {
  type: string;
  id?: Types.ObjectId | string;
}
