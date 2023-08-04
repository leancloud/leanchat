import { IMessage } from 'src/common/interfaces';

export interface IUpdateVisitorDto {
  status?: string;
  recentMessage?: IMessage;
}
