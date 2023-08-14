import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Socket } from 'socket.io-client';
import { produce } from 'immer';

import { Conversation, Message } from '@/App/Panel/types';
import {
  getConversation,
  getConversationMessages,
  getConversations,
} from '@/App/Panel/api/conversation';

export type ConversationsQueryVariables =
  | {
      type: 'unassigned';
    }
  | {
      type: 'solved';
    }
  | {
      type: 'allOperators';
    }
  | {
      type: 'operator';
      operatorId: string;
    };

export type ConversationQueryKey = ['Conversations', ConversationsQueryVariables];

export function useConversations(variables: ConversationsQueryVariables) {
  return useQuery({
    queryKey: ['Conversations', variables] as const,
    queryFn: ({ queryKey }) => {
      const [, variables] = queryKey;
      switch (variables.type) {
        case 'unassigned':
          return getConversations({
            status: 'queued',
            sort: 'queuedAt',
            desc: true,
          });
        case 'solved':
          return getConversations({
            status: 'solved',
            desc: true,
          });
        case 'allOperators':
          return getConversations({
            status: 'inProgress',
            desc: true,
          });
        case 'operator':
          return getConversations({
            status: 'inProgress',
            operatorId: variables.operatorId,
            desc: true,
          });
      }
    },
    staleTime: 1000 * 60,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['Conversation', id],
    queryFn: () => getConversation(id),
    staleTime: 1000 * 5,
  });
}

export function useSetConversationQueryData() {
  const queryClient = useQueryClient();
  return useCallback(
    (conversation: Conversation) => {
      queryClient.setQueryData(['Conversation', conversation.id], conversation);
    },
    [queryClient],
  );
}

export function useConversationMessages(conversationId: string) {
  return useQuery({
    queryKey: ['Messages', { conversationId }],
    queryFn: () => getConversationMessages(conversationId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAutoPushNewMessage(socket: Socket) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const onMessage = (message: Message) => {
      queryClient.setQueryData<Message[] | undefined>(
        ['Messages', { conversationId: message.conversationId }],
        (messages) => {
          if (messages) {
            return [...messages, message];
          }
        },
      );
      queryClient.setQueriesData<Conversation[] | undefined>(['Conversations'], (conversations) => {
        if (conversations) {
          return produce(conversations, (draft) => {
            draft.forEach((conversation) => {
              if (conversation.id === message.conversationId) {
                conversation.lastMessage = message;
              }
            });
          });
        }
      });
    };
    socket.on('message', onMessage);
    return () => {
      socket.off('message', onMessage);
    };
  }, [socket, queryClient]);
}

export function useConversationSubscription(socket: Socket) {
  const queryClient = useQueryClient();
  useEffect(() => {
    // TODO: HEAVY!!!
    const invalidateQueries = () => {
      queryClient.invalidateQueries(['Conversations']);
      queryClient.invalidateQueries(['Conversation']);
    };
    socket.on('conversationQueued', invalidateQueries);
    socket.on('conversationAssigned', invalidateQueries);
    socket.on('conversationClosed', invalidateQueries);
    return () => {
      socket.off('conversationQueued', invalidateQueries);
      socket.off('conversationAssigned', invalidateQueries);
      socket.off('conversationClosed', invalidateQueries);
    };
  }, [socket, queryClient]);
}
