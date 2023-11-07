import { useEffect, useState } from 'react';

function getWindowSize() {
  const { innerWidth, innerHeight } = window.top || window;
  return {
    width: innerWidth,
    height: innerHeight,
  };
}

export function useWindowSize() {
  const [size, setSize] = useState(getWindowSize);
  useEffect(() => {
    const w = window.top || window;
    const onResize = () => {
      setSize(getWindowSize());
    };
    w.addEventListener('resize', onResize);
    return () => {
      w.removeEventListener('resize', onResize);
    };
  }, []);
  return size;
}
