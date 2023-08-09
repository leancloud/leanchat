import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { produce } from 'immer';

import { Conversation, Message } from '@/App/Panel/types';
import { useEffectEvent } from '@/App/Panel/hooks/useEffectEvent';
import { ConversationsContext, ConversationsContextValue } from './ConversationsContext';
import { ConversationContext } from './ConversationContext';
import { getVisitorMessages } from '../api/visitor';
import {
  MessagesContext,
  MessagesContextValue,
  createDefaultMessagesContextValue,
} from './MessagesContext';
import { InboxContext } from './InboxContext';

interface Channel {
  key: string;
  label: ReactNode;
  fetch: () => Promise<Conversation[]>;
}

const ChannelContext = createContext<
  [Channel | undefined, Dispatch<SetStateAction<Channel | undefined>>]
>(undefined as any);

export function useChannelContext() {
  return useContext(ChannelContext);
}

interface InboxProps {
  children?: ReactNode;
}

export function Inbox({ children }: InboxProps) {
  const [channel, setChannel] = useState<Channel>();

  const [channelContexts, setChannelContexts] = useState<Record<string, ConversationsContextValue>>(
    {}
  );

  const [conversation, setConversation] = useState<Conversation>();

  const [messagesContextMap, setMessagesContextMap] = useState<
    Record<string, MessagesContextValue>
  >({});

  const setChannelContext = useCallback((key: string, ctx: Partial<ConversationsContextValue>) => {
    setChannelContexts((prev) => {
      const prevCtx = prev[key] || { isLoading: false };
      return { ...prev, [key]: { ...prevCtx, ...ctx } };
    });
  }, []);

  const setMessagesContext = useCallback(
    (visitorId: string, ctx: Partial<MessagesContextValue>) => {
      setMessagesContextMap((prevMap) => {
        const prevCtx = prevMap[visitorId] || createDefaultMessagesContextValue();
        return { ...prevMap, [visitorId]: { ...prevCtx, ...ctx } };
      });
    },
    []
  );

  const fetchChannelConversations = useEffectEvent((channel: Channel) => {
    const ctx = channelContexts[channel.key];
    if (ctx && (ctx.isLoading || ctx.conversations)) {
      return;
    }
    setChannelContext(channel.key, { isLoading: true });
    channel.fetch().then((conversations) => {
      setChannelContext(channel.key, {
        isLoading: false,
        conversations,
      });
    });
  });

  const fetchVisitorMessages = useEffectEvent((visitorId: string) => {
    const ctx = messagesContextMap[visitorId];
    if (ctx && (ctx.isLoading || ctx.messages)) {
      return;
    }
    getVisitorMessages(visitorId).then((messages) => {
      setMessagesContext(visitorId, {
        isLoading: false,
        messages,
      });
    });
  });

  const addMessage = useCallback((message: Message) => {
    setMessagesContextMap((prev) => {
      return produce(prev, (draft) => {
        const ctx = draft[message.visitorId];
        if (ctx) {
          if (ctx.isLoading) {
            ctx.messagesOnLoading.push(message);
          } else {
            ctx.messages?.push(message);
          }
        }
      });
    });

    setChannelContexts((state) => {
      return produce(state, (draft) => {
        Object.values(draft).forEach(({ conversations }) => {
          conversations?.forEach((conv) => {
            if (conv.visitorId === message.visitorId) {
              conv.lastMessage = message;
            }
          });
        });
      });
    });
  }, []);

  useEffect(() => {
    if (channel) {
      fetchChannelConversations(channel);
    }
  }, [channel]);

  useEffect(() => {
    if (conversation) {
      fetchVisitorMessages(conversation.visitorId);
    }
  }, [conversation]);

  let conversationsContextValue: ConversationsContextValue = {
    isLoading: false,
  };
  if (channel && channelContexts[channel.key]) {
    conversationsContextValue = channelContexts[channel.key];
  }

  const getMessagesContextValue = () => {
    if (conversation) {
      const ctx = messagesContextMap[conversation.visitorId];
      if (ctx) {
        return ctx;
      }
    }
    return createDefaultMessagesContextValue();
  };

  return (
    <InboxContext.Provider value={{ addMessage }}>
      <ChannelContext.Provider value={[channel, setChannel]}>
        <ConversationsContext.Provider value={conversationsContextValue}>
          <ConversationContext.Provider value={{ conversation, setConversation }}>
            <MessagesContext.Provider value={getMessagesContextValue()}>
              {children}
            </MessagesContext.Provider>
          </ConversationContext.Provider>
        </ConversationsContext.Provider>
      </ChannelContext.Provider>
    </InboxContext.Provider>
  );
}
