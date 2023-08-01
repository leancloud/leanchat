export interface Conversation {
  id: string;
}

export interface Message {
  id: string;
  cid: string;
  uid: string;
  text: string;
  createTime: number;
}
