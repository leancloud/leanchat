import { Operator } from '@/App/Panel/types';
import { client } from './client';

export async function createSession(username: string, password: string) {
  const res = await client.post<Operator>('/sessions', { username, password });
  return res.data;
}
