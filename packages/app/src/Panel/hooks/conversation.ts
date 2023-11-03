import { useCallback, useEffect } from 'react';
import {
  InfiniteData,
  Query,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Socket } from 'socket.io-client';
import { produce } from 'immer';
import _ from 'lodash';

import { Conversation, Message, MessageType } from '@/Panel/types';
import {
  GetConversationsOptions,
  conversationMatchFilters,
  getConversation,
  getConversations,
  updateConversation,
} from '@/Panel/api/conversation';

export function useConversations(options: GetConversationsOptions) {
  const pageSize = 10;
  return useInfiniteQuery({
    queryKey: ['Conversations', options] as const,
    queryFn: ({ queryKey: [, options], pageParam }) =>
      getConversations({
        ...options,
        pageSize,
        [options.desc ? 'before' : 'after']: pageParam,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.length === pageSize) {
        return lastPage[lastPage.length - 1].createdAt;
      }
    },
    staleTime: 1000 * 60,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['Conversation', id],
    queryFn: () => getConversation(id),
    staleTime: 1000 * 60,
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

export function useAutoPushNewMessage(socket: Socket) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onMessage = (message: Message) => {
      queryClient.setQueryData<InfiniteData<Message[]> | undefined>(
        ['Messages', { conversationId: message.conversationId }],
        (data) => {
          if (data) {
            return {
              pages: [[message, ...data.pages[0]], ...data.pages.slice(1)],
              pageParams: [...data.pageParams],
            };
          }
        },
      );
      queryClient.setQueryData<InfiniteData<Message[]> | undefined>(
        ['Messages', { visitorId: message.visitorId }],
        (data) => {
          if (data) {
            return {
              pages: [[message, ...data.pages[0]], ...data.pages.slice(1)],
              pageParams: [...data.pageParams],
            };
          }
        },
      );
      if (message.type === MessageType.Message) {
        queryClient.setQueriesData<InfiniteData<Conversation[]> | undefined>(
          ['Conversations'],
          (data) => {
            if (data) {
              return produce(data, (data) => {
                for (const page of data.pages) {
                  for (const conversation of page) {
                    if (conversation.id === message.conversationId) {
                      conversation.lastMessage = message;
                      break;
                    }
                  }
                }
              });
            }
          },
        );
      }
    };
    socket.on('message', onMessage);
    return () => {
      socket.off('message', onMessage);
    };
  }, [socket, queryClient]);
}

interface ConversationUpdatedEvent {
  conversation: Conversation;
  fields: string[];
}

function findConversation(pages: Conversation[][], id: string) {
  for (let pagesIndex = 0; pagesIndex < pages.length; ++pagesIndex) {
    const page = pages[pagesIndex];
    for (let pageIndex = 0; pageIndex < page.length; ++pageIndex) {
      if (page[pageIndex].id === id) {
        return { pagesIndex, pageIndex };
      }
    }
  }
}

export function useSubscribeConversations(socket: Socket) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let timeoutId: number | undefined;
    let lastInvalidateTime = 0;
    const invalidQueries = new Set<Query>();

    const invalidateQuery = (query: Query) => {
      clearTimeout(timeoutId);
      invalidQueries.add(query);
      const timeout = Date.now() - lastInvalidateTime > 1000 ? 200 : 1000;
      setTimeout(() => {
        invalidQueries.forEach((query) => {
          if (query.isActive()) {
            query.fetch();
          } else {
            query.invalidate();
          }
        });
        invalidQueries.clear();
        lastInvalidateTime = Date.now();
      }, timeout);
    };

    const applyConversation = (conv: Conversation) => {
      const cache = queryClient.getQueryCache();
      const queries = cache.findAll({
        queryKey: ['Conversations'],
      });
      for (const query of queries) {
        const filters = query.queryKey[1] as GetConversationsOptions;
        const stayInData = conversationMatchFilters(conv, filters);
        const data = query.state.data as InfiniteData<Conversation[]> | undefined;
        if (data) {
          const position = findConversation(data.pages, conv.id);
          if (position) {
            if (stayInData) {
              query.setData(
                produce(data, (data) => {
                  data.pages[position.pagesIndex][position.pageIndex] = conv;
                }),
              );
            } else {
              invalidateQuery(query);
            }
          } else {
            if (stayInData) {
              invalidateQuery(query);
            }
          }
        }
      }
    };

    const onConversationCreated = applyConversation;
    const onConversationUpdated = (e: ConversationUpdatedEvent) => {
      applyConversation(e.conversation);
    };

    socket.on('conversationCreated', applyConversation);
    socket.on('conversationUpdated', onConversationUpdated);
    return () => {
      socket.off('conversationCreated', onConversationCreated);
      socket.off('conversationUpdated', onConversationUpdated);
    };
  }, [socket, queryClient]);
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: Parameters<typeof updateConversation>) => {
      return updateConversation(...args);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['Conversation', data.id], data);
    },
  });
}
