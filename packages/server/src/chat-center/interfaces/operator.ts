import { Types } from 'mongoose';

import { OperatorStatus } from 'src/chat/constants';

export interface CreateOperatorWorkingTimeData {
  operatorId: string | Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: OperatorStatus;
  ip?: string;
}

export interface ListOperatorWorkingTimeOptions {
  operatorId: string | Types.ObjectId;
  from: Date;
  to: Date;
  skip?: number;
  limit?: number;
}
