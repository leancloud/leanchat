import { useEffect, useState } from 'react';

function getStorageKey(key: string) {
  return `LeanChat/${location.host}/${key}`;
}

export function useSessionStorage(key: string) {
  const [state, setState] = useState(() => {
    try {
      return sessionStorage.getItem(getStorageKey(key)) ?? undefined;
    } catch {}
  });

  useEffect(() => {
    if (state === undefined) {
      sessionStorage.removeItem(getStorageKey(key));
    } else {
      sessionStorage.setItem(getStorageKey(key), state);
    }
  });

  return [state, setState] as const;
}
