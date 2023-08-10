import { ReactNode, createContext, useCallback, useContext, useRef, useState } from 'react';

import { Conversation } from '@/App/Panel/types';

interface ConversationsQuery {
  isLoading: boolean;
  conversations?: Conversation[];
  error?: Error;
}

function createDefaultConversationQuery(): ConversationsQuery {
  return {
    isLoading: true,
  };
}

interface FetchConversationsOptions {
  key: string;
  fetch: () => Promise<Conversation[]>;
}

interface ChatContextValue {
  conversationsQueries: Record<string, ConversationsQuery>;
  fetchConversations: (options: FetchConversationsOptions) => void;
}

const ChatContext = createContext<ChatContextValue>(undefined as any);

function useCurrentRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

interface ChatProps {
  children?: ReactNode;
}

export function Chat({ children }: ChatProps) {
  const [conversationsQueries, setConversationQueries] = useState<
    Record<string, ConversationsQuery>
  >({});

  const conversationsQueriesRef = useCurrentRef(conversationsQueries);

  const setConversationQuery = useCallback((key: string, query: Partial<ConversationsQuery>) => {
    setConversationQueries((prevQueries) => {
      const prevQuery = prevQueries[key] || createDefaultConversationQuery();
      return {
        ...prevQueries,
        [key]: { ...prevQuery, ...query },
      };
    });
  }, []);

  const fetchConversations = useCallback((options: FetchConversationsOptions) => {
    const { key, fetch } = options;
    const conversationsQueries = conversationsQueriesRef.current;

    const query = conversationsQueries[key];
    if (query && (query.isLoading || query.conversations)) {
      return;
    }

    setConversationQuery(key, { isLoading: true });
    fetch()
      .then((conversations) => {
        setConversationQuery(key, {
          isLoading: false,
          conversations,
        });
      })
      .catch((error) => {
        setConversationQuery(key, {
          isLoading: false,
          error,
        });
      });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversationsQueries,
        fetchConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  return useContext(ChatContext);
}

export function useConversations(key: string) {
  const { conversationsQueries } = useChatContext();
  return conversationsQueries[key] || createDefaultConversationQuery();
}
