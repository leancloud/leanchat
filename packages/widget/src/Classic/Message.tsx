import { ReactNode } from 'react';
import cx from 'classnames';

interface TextMessageProps {
  children?: ReactNode;
  position?: 'left' | 'right';
}

export function TextMessage({ children, position = 'left' }: TextMessageProps) {
  return (
    <div
      className={cx('flex', {
        'flex-row-reverse': position === 'right',
      })}
    >
      <div
        className={cx(
          'bg-white text-[#6c6c6c] p-2 inline-block max-w-[85%] rounded-md min-w-[32px] whitespace-pre-line break-all',
          {
            'rounded-bl-none': position === 'left',
            'rounded-br-none !bg-[#CEF2FF] text-black': position === 'right',
          },
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface ProgressMessageProps {
  progress: number;
}

export function ProgressMessage({ progress }: ProgressMessageProps) {
  return (
    <TextMessage position="right">
      <div className="bg-[rgba(0,0,0,0.06)] rounded-full w-[100px] h-[4px] my-2 overflow-hidden">
        <div className="bg-blue-500 h-full" style={{ width: `${progress}%` }} />
      </div>
    </TextMessage>
  );
}
