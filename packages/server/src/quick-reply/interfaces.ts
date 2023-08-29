export interface CreateQuickReplyData {
  content: string;
  tags?: string[];
}

export interface UpdateQuickReplyData {
  content?: string;
  tags?: string[];
}
