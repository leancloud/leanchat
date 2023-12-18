import { useEffect, useRef, useState } from 'react';

interface ReplyDraft {
  key: string;
  content: string;
}

let drafts: ReplyDraft[] = [];
const size = 10;

export function useReplyDraft(key: string) {
  const [content, setContent] = useState(() => {
    const index = drafts.findIndex((d) => d.key === key);
    if (index === -1) {
      return '';
    }
    drafts = [drafts[index], ...drafts.slice(0, index), ...drafts.slice(index + 1)];
    return drafts[0].content;
  });

  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    return () => {
      drafts = drafts.filter((d) => d.key !== key);
      const content = contentRef.current;
      if (content) {
        drafts = [{ key, content }, ...drafts.slice(0, size - 1)];
      }
    };
  }, [key]);

  return [content, setContent] as const;
}
