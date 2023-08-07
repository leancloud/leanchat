import { client } from './client';

export interface Conversation {
  id: string;
  channel: string;
  recentMessage?: Message;
  status?: string;
  operatorId?: string;
}

export interface Message {
  id: string;
  type: string;
  from: string;
  data: {
    content: string;
  };
  createdAt: string;
}

export async function getConversations(type: string) {
  const res = await client.get<Conversation[]>('/conversations', {
    params: { type },
  });
  return res.data;
}

export async function getConversationMessages(id: string) {
  const res = await client.get<Message[]>(`/conversations/${id}/messages`);
  return res.data;
}

export async function joinConversation(id: string) {
  await client.post(`/conversations/${id}/join`);
}

export async function closeConversation(id: string) {
  await client.post(`/conversations/${id}/close`);
}
