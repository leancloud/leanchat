import { Category } from '../types';
import { client } from './client';

export interface CreateCategoryData {
  name: string;
  parentId?: string;
}

export async function createCategory(data: CreateCategoryData) {
  const res = await client.post<Category>('/categories', data);
  return res.data;
}

export async function createCategorys(data: CreateCategoryData[]) {
  const res = await client.post<Category[]>('/categories/batch', { data });
  return res.data;
}

export async function getCategories() {
  const res = await client.get<Category[]>('/categories');
  return res.data;
}

export interface UpdateCategoryData {
  name?: string;
}

export async function updateCategory(id: string, data: UpdateCategoryData) {
  await client.patch(`/categories/${id}`, data);
}
