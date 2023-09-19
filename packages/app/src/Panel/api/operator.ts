import { Operator } from '@/Panel/types';
import { client } from './client';

export async function getOperator(id: string) {
  const res = await client.get<Operator>(`/operators/${id}`);
  return res.data;
}

export async function getOperators() {
  const res = await client.get<Operator[]>('/operators');
  return res.data;
}

interface CreateOpeatorData {
  username: string;
  password: string;
  externalName: string;
  internalName: string;
  concurrency: number;
}

export async function createOperator(data: CreateOpeatorData) {
  const res = await client.post<Operator>('/operators', data);
  return res.data;
}

interface UpdateOperatorData {
  id: string;
  password?: string;
  externalName?: string;
  internalName?: string;
  concurrency?: number;
}

export async function updateOperator({ id, ...data }: UpdateOperatorData) {
  const res = await client.patch<Operator>(`/operators/${id}`, data);
  return res.data;
}

export async function setStatus(status: string) {
  await client.post('/operators/me/setStatus', { status });
}
