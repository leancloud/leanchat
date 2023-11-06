export enum ConversationStatus {
  Open = 0,
  Closed = 1,
}

export interface Conversation {
  id: string;
  status: ConversationStatus;
  evaluation?: {
    star: number;
    feedback: string;
  };
}

export enum MessageType {
  Message = 0,
  Evaluation = 1,
  Close = 2,
  Reopen = 4,
}

export interface Message {
  id: string;
  type: MessageType;
  from: {
    type: number;
    id: string;
  };
  data: any;
}

export interface EvaluateData {
  star: number;
  feedback: string;
}
