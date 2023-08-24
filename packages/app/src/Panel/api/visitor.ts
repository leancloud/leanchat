import { Message } from '@/Panel/types';
import { client } from './client';

export async function getVisitorMessages(visitorId: string) {
  const res = await client.get<Message[]>(`/visitors/${visitorId}/messages`);
  return res.data;
}
