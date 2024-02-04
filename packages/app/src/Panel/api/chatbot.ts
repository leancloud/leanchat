import { Chatbot, ChatbotMessage, ChatbotQuestion, ChatbotQuestionBase } from '../types';
import { client } from './client';

export interface CreateQuestionBaseData {
  name: string;
}

export interface UpdateQuestionBaseData {
  id: string;
  name?: string;
}

export interface CreateQuestionData {
  questionBaseId: string;
  matcher: number;
  question: string;
  similarQuestions?: string[];
  answer: ChatbotMessage;
  nextQuestionBaseId?: string;
  assignOperator?: boolean;
  code?: string;
}

export interface UpdateQuestionData {
  questionBaseId: string;
  questionId: string;
  matcher?: number;
  question?: string;
  similarQuestions?: string[];
  answer?: ChatbotMessage;
  nextQuestionBaseId?: string | null;
  assignOperator?: boolean;
  code?: string | null;
}

export interface DeleteQuestionData {
  questionBaseId: string;
  questionId: string;
}

export interface CreateChatbotData {
  name: string;
  acceptRule?: number;
  workingTime?: {
    start: number;
    end: number;
  };
  globalQuestionBaseIds?: string[];
  initialQuestionBaseIds?: string[];
  greetingMessage: ChatbotMessage;
  noMatchMessage: ChatbotMessage;
}

export interface UpdateChatbotData {
  id: string;
  name?: string;
  acceptRule?: number | null;
  workingTime?: {
    start: number;
    end: number;
  } | null;
  globalQuestionBaseIds?: string[];
  initialQuestionBaseIds?: string[];
  greetingMessage?: ChatbotMessage;
  noMatchMessage?: ChatbotMessage;
}

interface ChatbotContext {
  questionBaseIds?: string[];
  operatorAssigned?: boolean;
}

export interface TestChatbotData {
  id: string;
  context: ChatbotContext;
  input: string;
}

export interface TestChatbotResult {
  context: ChatbotContext;
  text: string;
}

export async function createQuestionBase(data: CreateQuestionBaseData) {
  const res = await client.post<ChatbotQuestionBase>('/chatbot-question-bases', data);
  return res.data;
}

export async function updateQuestionBase({ id, ...data }: UpdateQuestionBaseData) {
  const res = await client.patch<ChatbotQuestionBase>(`/chatbot-question-bases/${id}`, data);
  return res.data;
}

export async function getQuestionBases() {
  const res = await client.get<ChatbotQuestionBase[]>('/chatbot-question-bases');
  return res.data;
}

export async function getQuestionBase(id: string) {
  const res = await client.get<ChatbotQuestionBase>(`/chatbot-question-bases/${id}`);
  return res.data;
}

export async function createQuestion({ questionBaseId, ...data }: CreateQuestionData) {
  const res = await client.post<ChatbotQuestion>(
    `/chatbot-question-bases/${questionBaseId}/questions`,
    data,
  );
  return res.data;
}

export async function updateQuestion({ questionBaseId, questionId, ...data }: UpdateQuestionData) {
  const res = await client.patch<ChatbotQuestion>(
    `/chatbot-question-bases/${questionBaseId}/questions/${questionId}`,
    data,
  );
  return res.data;
}

export async function deleteQuestion({ questionBaseId, questionId }: DeleteQuestionData) {
  await client.delete(`/chatbot-question-bases/${questionBaseId}/questions/${questionId}`);
}

export async function getQuestions(questionBaseId: string) {
  const res = await client.get<ChatbotQuestion[]>(
    `/chatbot-question-bases/${questionBaseId}/questions`,
  );
  return res.data;
}

export async function reorderQuestions(ids: string[]) {
  await client.post('/chatbot-question-bases/reorder-questions', { ids });
}

export async function createChatbot(data: CreateChatbotData) {
  const res = await client.post<Chatbot>('/chatbots', data);
  return res.data;
}

export async function updateChatbot({ id, ...data }: UpdateChatbotData) {
  const res = await client.patch<Chatbot>(`/chatbots/${id}`, data);
  return res.data;
}

export async function getChatbots() {
  const res = await client.get<Chatbot[]>('/chatbots');
  return res.data;
}

export async function testChatbot({ id, ...data }: TestChatbotData) {
  const res = await client.post<TestChatbotResult>(`/chatbots/${id}/test`, data);
  return res.data;
}
