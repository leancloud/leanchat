export interface Conversation {
  id: string;
  evaluation?: {
    star: number;
    feedback: string;
  };
}

export interface Message {
  id: string;
  type: string;
  from: {
    type: string;
    id: string;
  };
  data: any;
}

export interface EvaluateData {
  star: number;
  feedback: string;
}
