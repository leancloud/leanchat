import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Socket } from 'socket.io-client';
import { produce } from 'immer';

import { Conversation, Message } from '@/Panel/types';
import {
  getConversation,
  getConversationMessages,
  getConversations,
} from '@/Panel/api/conversation';

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

interface ConversationEvent {
  conversation: Conversation;
}

export function useSubscribeConversations(socket: Socket) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unshiftConversation = (key: ConversationsQueryVariables, conv: Conversation) => {
      queryClient.setQueryData<Conversation[] | undefined>(
        ['Conversations', key],
        (data) => data && [conv, ...data],
      );
    };

    const removeConversation = (id: string) => {
      queryClient.setQueriesData<Conversation[] | undefined>(
        ['Conversations'],
        (data) => data && data.filter((conv) => conv.id !== id),
      );
    };

    const setConversation = (conv: Conversation) => {
      queryClient.setQueryData<Conversation | undefined>(
        ['Conversation', conv.id],
        (data) => data && conv,
      );
    };

    const onConversationQueued = (e: ConversationEvent) => {
      unshiftConversation({ type: 'unassigned' }, e.conversation);
    };

    const onConversationAssigned = (e: ConversationEvent) => {
      removeConversation(e.conversation.id);
      unshiftConversation({ type: 'allOperators' }, e.conversation);
      unshiftConversation(
        { type: 'operator', operatorId: e.conversation.operatorId! },
        e.conversation,
      );
      setConversation(e.conversation);
    };

    const onConversationClosed = (e: ConversationEvent) => {
      removeConversation(e.conversation.id);
      unshiftConversation({ type: 'solved' }, e.conversation);
      setConversation(e.conversation);
    };

    socket.on('conversationQueued', onConversationQueued);
    socket.on('conversationAssigned', onConversationAssigned);
    socket.on('conversationClosed', onConversationClosed);
    return () => {
      socket.off('conversationQueued', onConversationQueued);
      socket.off('conversationAssigned', onConversationAssigned);
      socket.off('conversationClosed', onConversationClosed);
    };
  }, [socket, queryClient]);
}
