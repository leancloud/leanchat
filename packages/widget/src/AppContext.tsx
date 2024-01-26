import { createContext, useContext } from 'react';
import type { Socket } from 'socket.io-client';
import type { Emitter } from 'mitt';

export interface AppContextValue {
  iframe: HTMLIFrameElement;
  socket: Socket;
  emitter: Emitter<any>;
  getDisplay: () => boolean;
}

export const AppContext = createContext<AppContextValue>(undefined as any);

export function useAppContext() {
  return useContext(AppContext);
}
