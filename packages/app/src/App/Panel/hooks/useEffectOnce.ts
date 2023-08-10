import { EffectCallback, useEffect, useRef } from 'react';

export function useEffectOnce(effect: EffectCallback) {
  const skip = useRef(false);
  useEffect(() => {
    if (skip.current) {
      return;
    }
    skip.current = true;
    return effect();
  }, []);
}
