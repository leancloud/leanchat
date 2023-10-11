export interface Conversation {
  id: string;
  evaluation?: {
    star: number;
    feedback: string;
  };
  closedAt?: string;
}

export interface Message {
  id: string;
  type: number;
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
