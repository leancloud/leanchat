import { useCallback, useEffect, useState } from 'react';
import {
  InfiniteData,
  Query,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { produce } from 'immer';
import toast from 'react-hot-toast';
import _ from 'lodash';
import dayjs from 'dayjs';

import { Conversation, ConversationStatus, Message, MessageType, UserType } from '@/Panel/types';
import {
  SearchConversationOptions,
  conversationMatchFilters,
  getConversation,
  searchConversation,
  updateConversation,
} from '@/Panel/api/conversation';
import { Toast } from '@/Panel/components/Toast';
import { useCurrentUser } from '../auth';
import { useEffectEvent } from './useEffectEvent';

type UseConversationsQueryKey = [
  'Conversations',
  { options: SearchConversationOptions; live?: boolean },
];

export function useConversations(options: SearchConversationOptions, live = true) {
  const pageSize = 10;
  const [fetchedAt, setFetchedAt] = useState<number>();
  const query = useInfiniteQuery({
    queryKey: ['Conversations', { options, live }] satisfies UseConversationsQueryKey,
    queryFn: async ({ queryKey: [, { options }], pageParam }) => {
      const { data } = await searchConversation({
        ...options,
        to: pageParam && dayjs(pageParam).subtract(1, 'ms').toISOString(),
        pageSize,
        desc: true,
        lastMessage: true,
      });
      if (!pageParam) {
        setFetchedAt(Date.now());
      }
      return data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === pageSize) {
        return _.last(lastPage)?.createdAt;
      }
    },
    staleTime: live ? 1000 * 60 : 0,
    cacheTime: live ? undefined : 0,
  });
  return { ...query, fetchedAt };
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
  const navigate = useNavigate();
  const user = useCurrentUser();

  const checkCategory = useEffectEvent(({ fields, conversation }: ConversationUpdatedEvent) => {
    if (
      conversation.operatorId === user.id &&
      fields.includes('status') &&
      conversation.status === ConversationStatus.Closed &&
      conversation.closedBy?.type === UserType.Visitor &&
      !conversation.categoryId
    ) {
      toast.custom(
        (t) =>
          (t.visible || null) && (
            <Toast
              title="用户关闭了未分类的会话"
              content={conversation.lastMessage?.data.text || '(暂无消息)'}
              onClick={() => {
                toast.dismiss(t.id);
                navigate(`/conversations/${conversation.id}`);
              }}
              onClose={() => toast.dismiss(t.id)}
            />
          ),
        {
          position: 'top-right',
          duration: 1000 * 60,
        },
      );
    }
  });

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
        queryKey: ['Conversations', { live: true }],
      });
      for (const query of queries) {
        const [, { options: filters }] = query.queryKey as UseConversationsQueryKey;
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

      queryClient.setQueryData<Conversation | undefined>(
        ['Conversation', conv.id],
        (data) => data && conv,
      );
    };

    const onConversationCreated = applyConversation;
    const onConversationUpdated = (e: ConversationUpdatedEvent) => {
      applyConversation(e.conversation);
      checkCategory(e);
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
    mutationFn: updateConversation,
    onSuccess: (data) => {
      queryClient.setQueryData(['Conversation', data.id], data);
    },
  });
}
