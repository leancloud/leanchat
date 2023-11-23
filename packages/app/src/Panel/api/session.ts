import { Operator } from '@/Panel/types';
import { client } from './client';

interface CreateSessionData {
  username?: string;
  password?: string;
  token?: string;
}

export async function createSession(data: CreateSessionData) {
  const res = await client.post<Operator>('/sessions', data);
  return res.data;
}
