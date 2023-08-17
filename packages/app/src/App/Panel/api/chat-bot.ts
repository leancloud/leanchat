import { ChatBot, ChatBotNode } from '@/App/Panel/types';
import { client } from './client';

interface CreateChatBotData {
  name: string;
  nodes: ChatBotNode[];
}

export async function createChatBot(data: CreateChatBotData) {
  const res = await client.post<ChatBot>('/chat-bots', data);
  return res.data;
}

export async function getChatBots() {
  const res = await client.get<Pick<ChatBot, 'id' | 'name'>[]>('/chat-bots');
  return res.data;
}

export async function getChatBot(id: string) {
  const res = await client.get<ChatBot>(`/chat-bots/${id}`);
  return res.data;
}

export interface UpdateChatBotData {
  name?: string;
  nodes?: ChatBotNode[];
}

export async function updateChatBot(id: string, data: UpdateChatBotData) {
  await client.patch(`/chat-bots/${id}`, data);
}
