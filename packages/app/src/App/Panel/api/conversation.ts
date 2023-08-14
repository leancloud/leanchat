import { Conversation, Message } from '@/App/Panel/types';
import { client } from './client';

export interface GetConversationsOptions {
  status?: string;
  operatorId?: string;
  sort?: string;
  desc?: boolean;
}

export async function getConversations(options?: GetConversationsOptions) {
  const res = await client.get<Conversation[]>('/conversations', {
    params: options,
  });
  return res.data;
}

export async function getConversation(id: string) {
  const res = await client.get<Conversation>(`/conversations/${id}`);
  return res.data;
}

export async function getConversationMessages(id: string) {
  const res = await client.get<Message[]>(`/conversations/${id}/messages`);
  return res.data;
}
