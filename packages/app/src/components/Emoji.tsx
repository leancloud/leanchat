import twemoji from 'twemoji';

interface EmojiProps {
  className?: string;
  children: string;
  size?: number;
}

export function Emoji({ children, size }: EmojiProps) {
  return (
    <span
      ref={(el) => {
        if (el) {
          twemoji.parse(el, {
            attributes: () => ({ width: size, style: 'vertical-align: sub' }),
          });
        }
      }}
    >
      {children}
    </span>
  );
}
