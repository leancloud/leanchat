export interface Conversation {
  id: string;
  creator: {
    id: string;
  };
  recentMessage?: {
    text: string;
  };
  createTime: number;
}
