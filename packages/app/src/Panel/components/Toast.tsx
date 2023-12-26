import { IoMdClose } from 'react-icons/io';

interface ToastProps {
  title: string;
  content: string;
  buttonText?: string;
  onClick: () => void;
  onClose: () => void;
}

export function Toast({ title, content, buttonText = '查看', onClick, onClose }: ToastProps) {
  return (
    <div className="w-[400px] bg-white ring-1 ring-black ring-opacity-5 rounded-lg shadow-lg text-sm flex relative group">
      <button
        className="absolute w-5 h-5 bg-gray-200 rounded-full -left-1.5 -top-1.5 invisible group-hover:visible flex"
        onClick={onClose}
      >
        <IoMdClose className="m-auto w-3 h-3" />
      </button>
      <div className="grow px-4 py-3 overflow-hidden">
        <div className="font-medium">{title}</div>
        <div className="mt-1 text-[#969696] truncate">{content}</div>
      </div>
      <button className="text-primary px-4 shrink-0 border-l" onClick={onClick}>
        {buttonText}
      </button>
    </div>
  );
}
