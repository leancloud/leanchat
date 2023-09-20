import { client } from './client';

export interface GreetingConfig {
  enabled: boolean;
  message: {
    text: string;
  };
}

export interface AutoCloseConversationConfig {
  timeout: number;
}

export async function getConfig<T>(key: string) {
  const res = await client.get<T | null>(`/config/${key}`);
  return res.data;
}

export async function setConfig(key: string, data: any) {
  await client.put(`/config/${key}`, data);
}
