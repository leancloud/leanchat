import { Dispatch, SetStateAction, createContext, useContext } from 'react';

import { Conversation } from '@/App/Panel/types';

export interface ConversationContextValue {
  conversation?: Conversation;
  setConversation: Dispatch<SetStateAction<Conversation | undefined>>;
}

export const ConversationContext = createContext<ConversationContextValue>({
  setConversation: () => {},
});

export function useConversationContext() {
  return useContext(ConversationContext);
}
