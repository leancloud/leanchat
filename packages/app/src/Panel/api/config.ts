import { client } from './client';

export interface GreetingMessageConfig {
  enabled: boolean;
  text: string;
}

export interface NoReadyOperatorMessageConfig {
  text: string;
}

export interface AutoCloseConfig {
  timeout: number;
  message: {
    enabled: boolean;
    text: string;
  };
}

export interface QueueConfig {
  capacity: number;
  fullMessage: {
    text: string;
  };
  queuedMessage: {
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
