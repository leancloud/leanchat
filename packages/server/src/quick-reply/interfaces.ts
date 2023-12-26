export interface CreateQuickReplyData {
  content: string;
  tags?: string[];
  operatorId?: string;
}

export interface UpdateQuickReplyData {
  content?: string;
  tags?: string[];
  operatorId?: string | null;
}
