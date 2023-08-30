import { Message } from '@/Panel/types';
import { client } from './client';

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
