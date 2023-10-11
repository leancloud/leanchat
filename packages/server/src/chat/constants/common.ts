export enum UserType {
  Visitor = 0,
  Operator = 1,
  System = 2,
}

export enum ConsultationResult {
  Valid = 0,
  Invalid = 1,
  OperatorNoResponse = 2,
}

export enum MessageType {
  Message = 0,
  Evaluate = 1,
  Close = 2,
  OperatorJoin = 3,
}

export enum OperatorStatus {
  Ready = 0,
  Busy = 1,
  Leave = 2,
}
