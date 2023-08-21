import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, message } from 'antd';
import _ from 'lodash';

import {
  UpdateChatBotData,
  createChatBot,
  getChatBot,
  updateChatBot,
} from '@/App/Panel/api/chat-bot';
import { ChatBotCreator } from './ChatBotCreator';

export function NewChatBot() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: createChatBot,
    onSuccess: () => {
      queryClient.invalidateQueries(['ChatBots']);
      message.success('已保存');
    },
  });

  return <ChatBotCreator onSave={mutate} onBack={() => navigate('..', { relative: 'path' })} />;
}

export function ChatBotDetail() {
  const { id } = useParams();

  const { data, isFetching } = useQuery({
    queryKey: ['ChatBot', id],
    queryFn: () => getChatBot(id!),
  });

  const queryClient = useQueryClient();

  const { mutate, isLoading: isSaving } = useMutation({
    mutationFn: (data: UpdateChatBotData) => {
      return updateChatBot(id!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ChatBots']);
      message.success('已保存');
    },
  });

  const navigate = useNavigate();

  if (!data || isFetching) {
    return (
      <div className="h-full flex justify-center items-center">
        <Spin />
      </div>
    );
  }

  return (
    <ChatBotCreator
      initialData={data}
      loading={isSaving}
      onSave={mutate}
      onBack={() => navigate('..', { relative: 'path' })}
    />
  );
}
