import { createContext, useContext } from 'react';

import { Conversation } from '@/App/Panel/types';

export interface ConversationsContextValue {
  isLoading: boolean;
  conversations?: Conversation[];
}

export const ConversationsContext = createContext<ConversationsContextValue>(undefined as any);

export function useConversationsContext() {
  return useContext(ConversationsContext);
}
