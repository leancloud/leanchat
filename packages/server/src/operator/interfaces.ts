export interface ICreateOperator {
  username: string;

  password: string;

  externalName: string;

  internalName: string;

  concurrency: number;
}

export type IUpdateOperator = Partial<Omit<ICreateOperator, 'username'>>;

export interface GetOperatorsOptions {
  ids?: string[];
}
