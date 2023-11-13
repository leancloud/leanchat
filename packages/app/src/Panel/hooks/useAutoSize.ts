import { RefObject, useEffect } from 'react';

export function useAutoSize(ref: RefObject<HTMLTextAreaElement>, maxRows?: number) {
  useEffect(() => {
    if (ref.current) {
      const element = ref.current;
      const computed = getComputedStyle(element);
      const lineHeight = parseInt(computed.lineHeight);
      const borderWidth = parseInt(computed.borderWidth);
      const paddingTop = parseInt(computed.paddingTop);
      const paddingBottom = parseInt(computed.paddingBottom);
      const resize = () => {
        element.style.height = '0';
        let maxHeight = element.scrollHeight + 2 * borderWidth;
        if (maxRows && maxRows > 0) {
          maxHeight = Math.min(maxHeight, paddingTop + paddingBottom + maxRows * lineHeight);
        }
        element.style.height = maxHeight + 'px';
      };
      element.addEventListener('input', resize);
      window.addEventListener('resize', resize);
      return () => {
        element.removeEventListener('input', resize);
        window.removeEventListener('resize', resize);
      };
    }
  }, [ref.current, maxRows]);
}
