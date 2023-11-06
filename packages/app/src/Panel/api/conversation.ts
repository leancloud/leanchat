import { Conversation, ConversationStatus, Message } from '@/Panel/types';
import { client } from './client';

export interface GetConversationsOptions {
  status?: ConversationStatus;
  operatorId?: string | null;
  desc?: boolean;
  after?: string;
  page?: number;
  pageSize?: number;
}

export async function getConversations(options?: GetConversationsOptions) {
  const res = await client.post<Conversation[]>('/conversation.list', options);
  return res.data;
}

export function conversationMatchFilters(conv: Conversation, filters: GetConversationsOptions) {
  if (filters.status !== undefined && conv.status !== filters.status) {
    return false;
  }
  if (filters.operatorId && conv.operatorId !== filters.operatorId) {
    return false;
  }
  if (filters.operatorId === null && conv.operatorId) {
    return false;
  }
  return true;
}

export async function getConversation(id: string) {
  const res = await client.get<Conversation>(`/conversations/${id}`);
  return res.data;
}

interface GetConversationMessagesOptions {
  desc?: boolean;
  limit?: number;
  cursor?: string;
}

export async function getConversationMessages(
  id: string,
  options?: GetConversationMessagesOptions,
) {
  const res = await client.get<Message[]>(`/conversations/${id}/messages`, {
    params: options,
  });
  return res.data;
}

export interface UpdateConversationData {
  operatorId?: string;
  categoryId?: string;
}

export async function updateConversation(id: string, data: UpdateConversationData) {
  const res = await client.patch<Conversation>(`/conversations/${id}`, data);
  return res.data;
}

export async function closeConversation(id: string) {
  await client.post(`/conversations/${id}/close`);
}

export async function reopenConversation(conversationId: string) {
  await client.post('/conversation.reopen', { conversationId });
}

export async function inviteEvaluation(id: string) {
  await client.post(`/conversations/${id}/inviteEvaluation`);
}

export async function assignconversation(id: string, operatorId: string) {
  await client.post(`/conversations/${id}/assign`, { operatorId });
}
