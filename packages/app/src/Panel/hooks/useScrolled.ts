import { RefCallback, useEffect, useState } from 'react';

export function useScrolled() {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!element) return;
    const onScroll = (e: Event) => {
      setScrolled((e.currentTarget as HTMLElement).scrollTop > 0);
    };
    element.addEventListener('scroll', onScroll);
    return () => {
      element.removeEventListener('scroll', onScroll);
    };
  }, [element]);

  return { ref: setElement as RefCallback<HTMLElement>, scrolled };
}
