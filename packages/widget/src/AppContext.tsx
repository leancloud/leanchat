import { createContext, useContext } from 'react';
import type { Socket } from 'socket.io-client';

export interface AppContextValue {
  iframe: HTMLIFrameElement;
  socket: Socket;
}

export const AppContext = createContext<AppContextValue>(undefined as any);

export function useAppContext() {
  return useContext(AppContext);
}
