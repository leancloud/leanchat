import type { OperatorRole, OperatorStatus } from '../constants';

export interface CreateOperatorData {
  role: OperatorRole;
  username: string;
  password: string;
  internalName: string;
  externalName: string;
  concurrency: number;
}

export interface UpdateOperatorData {
  password?: string;
  role?: OperatorRole;
  externalName?: string;
  internalName?: string;
  concurrency?: number;
  workload?: number;
  status?: OperatorStatus;
  statusUpdatedAt?: Date;
}
