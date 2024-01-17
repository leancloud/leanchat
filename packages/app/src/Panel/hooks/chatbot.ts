import { UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';

import {
  createChatbot,
  deleteQuestion,
  getChatbots,
  getQuestionBase,
  getQuestionBases,
  getQuestions,
  updateChatbot,
  updateQuestionBase,
} from '../api/chatbot';
import { ChatbotQuestion, ChatbotQuestionBase } from '../types';

export function useChatbotQuestionBases() {
  return useQuery({
    queryKey: ['ChatbotQuestionBases'],
    queryFn: getQuestionBases,
    staleTime: 1000 * 60,
  });
}

export function useChatbotQuestionBase(id: string) {
  return useQuery({
    queryKey: ['ChatbotQuestionBase', id],
    queryFn: () => getQuestionBase(id),
  });
}

export function useChatbotQuestions(
  questionBaseId: string,
  options?: UseQueryOptions<ChatbotQuestion[]>,
) {
  return useQuery({
    queryKey: ['ChatbotQuestions', questionBaseId],
    queryFn: () => getQuestions(questionBaseId!),
    staleTime: 1000 * 60,
    ...options,
  });
}

export function useUpdateQuestionBase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateQuestionBase,
    onSuccess: (data) => {
      queryClient.setQueryData(['ChatbotQuestionBase', data.id], data);
      queryClient.setQueryData<ChatbotQuestionBase[] | undefined>(
        ['ChatbotQuestionBases'],
        (oldData) => {
          if (oldData) {
            return produce(oldData, (oldData) => {
              const i = oldData.findIndex((qb) => qb.id === data.id);
              if (i !== -1) {
                oldData[i] = data;
              }
            });
          }
        },
      );
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuestion,
    onSuccess: (_data, { questionBaseId }) => {
      queryClient.invalidateQueries(['ChatbotQuestions', questionBaseId]);
    },
  });
}

export function useChatbots() {
  return useQuery({
    queryKey: ['Chatbots'],
    queryFn: () => getChatbots(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateChatbot() {
  return useMutation({
    mutationFn: createChatbot,
  });
}

export function useUpdateChatbot() {
  return useMutation({
    mutationFn: updateChatbot,
  });
}
