import { useCallback, useRef } from 'react';

export function useCurrentValue<T>(value: T) {
  const valueRef = useRef(value);
  valueRef.current = value;
  return useCallback(() => valueRef.current, []);
}
