import { IMessage } from 'src/common/interfaces';

export interface GetVisitorsOptions {
  conditions: {
    status?: string;
    operatorId?: string | null;
  };
  orderBy?: string;
  desc?: boolean;
}

export interface IUpdateVisitorDto {
  status?: string;
  recentMessage?: IMessage;
  operatorId?: string | null;
  queuedAt?: Date;
}
