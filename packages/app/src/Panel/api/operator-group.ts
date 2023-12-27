import { OperatorGroup } from '../types';
import { client } from './client';

interface CreateOperatorGroupData {
  name: string;
  operatorIds?: string[];
}

interface UpdateOperatorGroupData {
  id: string;
  name?: string;
  operatorIds?: string[];
}

export async function createOperatorGroup(data: CreateOperatorGroupData) {
  const res = await client.post<OperatorGroup>('/operator-groups', data);
  return res.data;
}

export async function getOperatorGroups() {
  const res = await client.get<OperatorGroup[]>('/operator-groups');
  return res.data;
}

export async function getOperatorGroup(id: string) {
  const res = await client.get<OperatorGroup>(`/operator-groups/${id}`);
  return res.data;
}

export async function updateOperatorGroup({ id, ...data }: UpdateOperatorGroupData) {
  const res = await client.patch<OperatorGroup>(`/operator-groups/${id}`, data);
  return res.data;
}

export async function deleteOperatorGroup(id: string) {
  await client.delete(`/operator-groups/${id}`);
}
