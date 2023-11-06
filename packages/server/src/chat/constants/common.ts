export enum OperatorRole {
  Operator = 1,
  Admin = 2,
}

export enum UserType {
  Visitor = 1,
  Operator = 2,
  System = 3,
}

export enum ConsultationResult {
  Valid = 1,
  Invalid = 2,
  OperatorNoResponse = 3,
}

export enum MessageType {
  Message = 1,
  Evaluate = 2,
  Close = 3,
  Assign = 4,
  Reopen = 5,
}

export enum OperatorStatus {
  Ready = 1,
  Busy = 2,
  Leave = 3,
}

export enum Channel {
  LiveChat = 1,
}

export enum ConversationStatus {
  Open = 1,
  Closed = 2,
}
