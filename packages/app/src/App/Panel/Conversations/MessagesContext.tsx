import { createContext, useContext } from 'react';

import { Message } from '@/App/Panel/types';

export interface MessagesContextValue {
  isLoading: boolean;
  messages?: Message[];
  messagesOnLoading: Message[];
}

export function createDefaultMessagesContextValue(): MessagesContextValue {
  return {
    isLoading: false,
    messagesOnLoading: [],
  };
}

export const MessagesContext = createContext<MessagesContextValue>(
  createDefaultMessagesContextValue()
);

export function useMessagesContext() {
  return useContext(MessagesContext);
}
