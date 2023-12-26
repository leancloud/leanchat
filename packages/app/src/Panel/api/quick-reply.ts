import { QuickReply } from '../types';
import { client } from './client';

export interface CreateQuickReplyData {
  content: string;
  tags?: string[];
  operatorId?: string;
}

export async function createQuickReply(data: CreateQuickReplyData) {
  const res = await client.post<QuickReply>('/quick-replies', data);
  return res.data;
}

export async function getQuickReplies() {
  const res = await client.get<QuickReply[]>('/quick-replies');
  return res.data;
}

export interface UpdateQuickReplyData {
  id: string;
  content?: string;
  tags?: string[];
  operatorId?: string | null;
}

export async function updateQuickReply({ id, ...data }: UpdateQuickReplyData) {
  await client.patch(`/quick-replies/${id}`, data);
}

export async function deleteQuickReply(id: string) {
  await client.delete(`/quick-replies/${id}`);
}
