import { ReactNode } from 'react';

import { useConversation } from '@/Panel/hooks/conversation';
import { ConversationContext } from '../contexts/ConversationContext';

interface ConversationProviderProps {
  conversationId: string;
  children?: ReactNode;
}

export function ConversationProvider({ conversationId, children }: ConversationProviderProps) {
  const { data: conversation } = useConversation(conversationId);
  if (!conversation) {
    return;
  }
  return (
    <ConversationContext.Provider value={{ conversation }}>{children}</ConversationContext.Provider>
  );
}
