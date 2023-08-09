import { createContext, useContext } from 'react';

import { Message } from '@/App/Panel/types';

export interface InboxContextValue {
  addMessage: (message: Message) => void;
}

export const InboxContext = createContext<InboxContextValue>(undefined as any);

export function useInboxContext() {
  return useContext(InboxContext);
}
