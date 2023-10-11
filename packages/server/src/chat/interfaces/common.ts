import { Types } from 'mongoose';

import { UserType } from '../constants';

export interface UserInfo {
  type: UserType;
  id?: Types.ObjectId | string;
}

export interface NumberCondition {
  eq?: number;
  gt?: number;
  lt?: number;
}
