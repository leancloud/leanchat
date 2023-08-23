import { ReactNode } from 'react';

import style from './Message.module.css';

interface MessageProps {
  children?: ReactNode;
  time?: ReactNode;
  type?: 'left' | 'right';
}

export function Message({ children, time, type = 'left' }: MessageProps) {
  return (
    <div className={`${style.message} ${type}`}>
      <div className={`${style.bubble}`}>{children}</div>
      {time && <div className={style.time}>{time}</div>}
    </div>
  );
}
