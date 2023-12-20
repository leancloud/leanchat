import { useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { getConversationMessages } from '../api/conversation';
import { getVisitorMessages } from '../api/visitor';

interface UseMessagesOptions {
  enabled?: boolean;
  pageSize?: number;
}

export function useConversationMessages(conversationId: string, options: UseMessagesOptions = {}) {
  // page size is fixed for infinite query
  const [pageSize] = useState(options.pageSize || 25);

  const { data, hasNextPage, fetchNextPage } = useInfiniteQuery({
    enabled: options.enabled,
    queryKey: ['Messages', { conversationId }],
    queryFn: ({ pageParam }) => {
      return getConversationMessages(conversationId, {
        desc: true,
        limit: pageSize,
        cursor: pageParam,
      });
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < pageSize) {
        return;
      }
      return lastPage[lastPage.length - 1]?.createdAt;
    },
    staleTime: 1000 * 60 * 5,
  });

  const messages = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.pages.flat().reverse();
  }, [data]);

  return {
    messages,
    hasMore: hasNextPage,
    loadMore: fetchNextPage,
  };
}

export function useVisitorMessages(visitorId: string, options: UseMessagesOptions = {}) {
  // page size is fixed for infinite query
  const [pageSize] = useState(options.pageSize || 25);

  const { data, hasNextPage, fetchNextPage } = useInfiniteQuery({
    enabled: options.enabled,
    queryKey: ['Messages', { visitorId }],
    queryFn: ({ pageParam }) => {
      return getVisitorMessages(visitorId, {
        desc: true,
        limit: pageSize,
        cursor: pageParam,
      });
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < pageSize) {
        return;
      }
      return lastPage[lastPage.length - 1]?.createdAt;
    },
    staleTime: 1000 * 60 * 5,
  });

  const messages = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.pages.flat().reverse();
  }, [data]);

  return {
    messages,
    hasMore: hasNextPage,
    loadMore: fetchNextPage,
  };
}
