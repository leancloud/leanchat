import { Conversation } from '../types';
import { client } from './client';

export async function getConversations(type: string) {
  const res = await client.get<Conversation[]>('/conversations', {
    params: { type },
  });
  return res.data;
}

export async function getUnassignedConversations() {
  const res = await client.get<Conversation[]>('/conversations/queued');
  return res.data;
}

export async function getOperatorConversations(operatorId: string) {
  const res = await client.get<Conversation[]>(`/conversations/operators/${operatorId}`);
  return res.data;
}

export async function getSolvedConversations() {
  const res = await client.get<Conversation[]>('/conversations/solved');
  return res.data;
}
