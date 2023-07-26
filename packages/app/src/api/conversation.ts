export interface Conversation {
  id: string;
  creator: {
    id: string;
  };
  assignee: {};
  recentMessage?: {
    text: string;
    createTime: number;
  };
}
