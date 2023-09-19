export interface CreateOperatorData {
  username: string;
  password: string;
  internalName: string;
  externalName: string;
  concurrency: number;
}

export interface UpdateOperatorData {
  password?: string;

  externalName?: string;

  internalName?: string;

  concurrency?: number;
}
