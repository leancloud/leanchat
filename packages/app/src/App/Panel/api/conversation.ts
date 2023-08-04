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

interface GetConversationsOptions {
  status?: string;
  operatorId?: string | null;
}

export async function getConversations(options?: GetConversationsOptions) {
  const res = await client.get<Conversation[]>('/conversations', {
    params: options,
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
