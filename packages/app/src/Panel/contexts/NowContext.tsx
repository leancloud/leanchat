import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

export const NowContext = createContext<Date>(new Date());

interface NowProviderProps {
  interval?: number;
  children?: ReactNode;
}

export function NowProvider({ interval = 1000 * 60, children }: NowProviderProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (interval <= 0) return;
    const id = setInterval(() => setNow(new Date()), interval);
    return () => {
      clearInterval(id);
    };
  }, [interval]);

  return <NowContext.Provider value={now}>{children}</NowContext.Provider>;
}

export function useNow() {
  return useContext(NowContext);
}
