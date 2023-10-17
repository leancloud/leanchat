export interface GetOperatorStatsOptions {
  from: Date;
  to: Date;
  operatorId?: string[];
}

export interface GetEvaluationStatsOptions {
  from: Date;
  to: Date;
  channel?: string;
  operatorId?: string[];
  skip?: number;
  limit?: number;
}
