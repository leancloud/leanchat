import { client } from './client';

interface GreetingConfig {
  enabled: boolean;
  message: {
    text: string;
  };
}

export async function getGreetingConfig() {
  const res = await client.get<GreetingConfig | undefined>('/config/greeting');
  return res.data;
}

export async function setGreetingConfig(data: GreetingConfig) {
  await client.put('/config/greeting', data);
}
