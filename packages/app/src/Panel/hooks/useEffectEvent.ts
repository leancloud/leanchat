import { useRef } from 'react';

export function useEffectEvent<T extends (...args: any[]) => any>(callback: T) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  return ((...args: any[]) => callbackRef.current(...args)) as T;
}
