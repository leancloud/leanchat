export enum OperatorRole {
  Operator = 0,
  Admin = 1,
}

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
  Assign = 3,
  Reopen = 4,
}

export enum OperatorStatus {
  Ready = 0,
  Busy = 1,
  Leave = 2,
}

export enum Channel {
  LiveChat = 0,
}

export enum ConversationStatus {
  Open = 0,
  Closed = 1,
}
