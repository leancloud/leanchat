import { createContext, useContext } from 'react';

import { Conversation } from '@/App/Panel/types';

interface ConversationContextValue {
  conversation: Conversation;
}

export const ConversationContext = createContext<ConversationContextValue>(undefined as any);

export function useConversationContext() {
  return useContext(ConversationContext);
}
