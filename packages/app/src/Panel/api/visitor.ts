import { Message, Visitor } from '@/Panel/types';
import { client } from './client';

export async function getVisitor(id: string) {
  const res = await client.get<Visitor>(`/visitors/${id}`);
  return res.data;
}

export interface UpdateVisitorData {
  name?: string;
  comment?: string;
}

export async function updateVisitor(id: string, data: UpdateVisitorData) {
  const res = await client.patch<Visitor>(`/visitors/${id}`, data);
  return res.data;
}

interface GetVisitorMessagesOptions {
  desc?: boolean;
  limit?: number;
  cursor?: string;
}

export async function getVisitorMessages(visitorId: string, options?: GetVisitorMessagesOptions) {
  const res = await client.get<Message[]>(`/visitors/${visitorId}/messages`, {
    params: options,
  });
  return res.data;
}
