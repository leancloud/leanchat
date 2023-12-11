import { RefObject, useEffect } from 'react';

import { useEffectEvent } from './useEffectEvent';

export function useAutoSize(ref: RefObject<HTMLTextAreaElement>, maxRows?: number) {
  const resize = useEffectEvent(() => {
    if (ref.current) {
      const element = ref.current;
      const computed = getComputedStyle(element);
      const borderWidth = parseInt(computed.borderWidth);
      element.style.height = '0';
      let maxHeight = element.scrollHeight + 2 * borderWidth;
      if (maxRows && maxRows > 0) {
        const lineHeight = parseInt(computed.lineHeight);
        const paddingTop = parseInt(computed.paddingTop);
        const paddingBottom = parseInt(computed.paddingBottom);
        maxHeight = Math.min(maxHeight, paddingTop + paddingBottom + maxRows * lineHeight);
      }
      element.style.height = maxHeight + 'px';
    }
  });

  useEffect(() => {
    if (ref.current) {
      const element = ref.current;
      element.addEventListener('input', resize);
      window.addEventListener('resize', resize);
      return () => {
        element.removeEventListener('input', resize);
        window.removeEventListener('resize', resize);
      };
    }
  }, [ref.current, maxRows]);

  return resize;
}
