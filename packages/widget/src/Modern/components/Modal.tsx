import { ReactNode } from 'react';

interface ModalProps {
  children: ReactNode;
}

export function Modal({ children }: ModalProps) {
  return <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)] flex">{children}</div>;
}
