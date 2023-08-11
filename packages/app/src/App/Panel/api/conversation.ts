import { Conversation, Message } from '@/App/Panel/types';
import { client } from './client';

export async function getConversations(type: string) {
  const res = await client.get<Conversation[]>('/conversations', {
    params: { type },
  });
  return res.data;
}

export async function getUnassignedConversations() {
  const res = await client.get<Conversation[]>('/conversations', {
    params: {
      status: 'queued',
      sort: 'queuedAt',
      desc: 1,
    },
  });
  return res.data;
}

export async function getOperatorConversations(operatorId: string) {
  const res = await client.get<Conversation[]>('/conversations', {
    params: {
      operatorId,
      status: 'inProgress',
      desc: 1,
    },
  });
  return res.data;
}

export async function getSolvedConversations() {
  const res = await client.get<Conversation[]>('/conversations', {
    params: {
      status: 'solved',
      desc: 1,
    },
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
