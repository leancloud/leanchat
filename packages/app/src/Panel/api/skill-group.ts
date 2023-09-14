import { SkillGroup } from '../types';
import { client } from './client';

interface CreateSkillGroupData {
  name: string;
  memberIds?: string[];
}

export async function createSkillGroup(data: CreateSkillGroupData) {
  const res = await client.post<SkillGroup>('/skill-groups', data);
  return res.data;
}

export async function getSkillGroups() {
  const res = await client.get<SkillGroup[]>('/skill-groups');
  return res.data;
}

export async function getSkillGroup(id: string) {
  const res = await client.get<SkillGroup>(`/skill-groups/${id}`);
  return res.data;
}

export interface UpdateSkillGroupData {
  name?: string;
  memberIds?: string[];
}

export async function updateSkillGroup(id: string, data: UpdateSkillGroupData) {
  const res = await client.patch<SkillGroup>(`/skill-groups/${id}`, data);
  return res.data;
}
