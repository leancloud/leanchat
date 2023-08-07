import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import { Socket, io } from 'socket.io-client';

const SocketContext = createContext<Socket | undefined>(undefined);

export function useEvent(socket: Socket, event: string, listener: (...args: any) => void) {
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    const listener = (...args: any[]) => listenerRef.current(...args);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}

interface SocketProviderProps {
  children?: ReactNode;
  fallback?: ReactNode;
  uri?: string;
  auth?: Record<string, any>;
}

export function SocketProvider({ children, fallback, uri, auth }: SocketProviderProps) {
  const socketRef = useRef<Socket>();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (socketRef.current) {
      return;
    }
    const socket = io(uri || '/', {
      transports: ['websocket'],
      auth,
    });
    socket.on('connect', () => setConnected(true));
    socketRef.current = socket;
  }, []);

  if (!connected) {
    return fallback;
  }

  return <SocketContext.Provider value={socketRef.current}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error('useSocket: socket is undefined');
  }
  return socket;
}

export type RpcResponse =
  | {
      success: true;
      result: any;
    }
  | {
      success: false;
      error: string;
    };

export function callRpc(socket: Socket, name: string, param?: any) {
  return new Promise<any>((resolve, reject) => {
    const callback = (err: Error, res: RpcResponse) => {
      if (err) {
        return reject(err);
      }
      if (res.success) {
        resolve(res.result);
      } else {
        reject(new Error(res.error));
      }
    };

    const args: [string, ...any[]] = [name];
    if (param !== undefined) {
      args.push(param);
    }
    args.push(callback);

    socket.timeout(5000).emit(...args);
  });
}

export function useSubscribeConversation(cid?: string) {
  const socket = useSocket();

  useEffect(() => {
    if (!cid) return;
    socket.emit('subscribeConversation', cid);
    return () => {
      socket.emit('unsubscribeConversation', cid);
    };
  }, [socket, cid]);
}
