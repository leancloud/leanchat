import { client } from './client';
import { Operator } from './operator';

export async function createSession(username: string, password: string) {
  const res = await client.post<Operator>('/sessions', { username, password });
  return res.data;
}
