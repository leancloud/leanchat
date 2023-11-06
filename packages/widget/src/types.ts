export enum ConversationStatus {
  Open = 1,
  Closed = 2,
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
  Message = 1,
  Evaluation = 2,
  Close = 3,
  Reopen = 5,
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
