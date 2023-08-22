import { useCallback, useRef } from 'react';

export function useScrollToBottom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);
  return { containerRef, scrollToBottom };
}
