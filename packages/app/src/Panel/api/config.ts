import { client } from './client';

export interface GreetingConfig {
  enabled: boolean;
  message: {
    text: string;
  };
}

export interface AutoCloseConfig {
  timeout: number;
}

export interface QueueConfig {
  capacity: number;
  fullMessage: {
    enabled: boolean;
    text: string;
  };
  queuedMessage: {
    enabled: boolean;
    text: string;
  };
}

export async function getConfig<T>(key: string) {
  const res = await client.get<T | null>(`/config/${key}`);
  return res.data;
}

export async function setConfig(key: string, data: any) {
  await client.put(`/config/${key}`, data);
}
