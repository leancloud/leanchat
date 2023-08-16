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
