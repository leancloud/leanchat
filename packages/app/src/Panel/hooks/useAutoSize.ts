import { RefObject, useEffect } from 'react';

import { useEffectEvent } from './useEffectEvent';

export function useAutoSize(ref: RefObject<HTMLTextAreaElement>, minRows = 1, maxRows?: number) {
  const resize = useEffectEvent(() => {
    const element = ref.current;
    if (!element) return;
    const computed = getComputedStyle(element);
    const lineHeight = parseInt(computed.lineHeight);
    const borderY = parseInt(computed.borderTopWidth) + parseInt(computed.borderBottomWidth);
    const paddingY = parseInt(computed.paddingTop) + parseInt(computed.paddingBottom);
    element.style.height = '0';
    let maxHeight = element.scrollHeight + borderY;
    if (maxRows && maxRows > 0) {
      maxHeight = Math.min(maxHeight, maxRows * lineHeight + paddingY);
    }
    element.style.height = Math.max(maxHeight, minRows * lineHeight + borderY + paddingY) + 'px';
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
  }, [ref.current, minRows, maxRows]);

  return resize;
}
