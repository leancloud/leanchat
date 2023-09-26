import { ReactNode } from 'react';

interface ModalProps {
  children: ReactNode;
}

export function Modal({ children }: ModalProps) {
  return (
    <div className="absolute top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.6)] flex">{children}</div>
  );
}
