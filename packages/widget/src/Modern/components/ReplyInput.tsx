import { ChangeEvent, KeyboardEvent, forwardRef, useRef, useState } from 'react';
import { PiPaperPlaneRightFill, PiPaperclipHorizontal } from 'react-icons/pi';

import { useUpload } from '../hooks/useUpload';

interface ProgressBarProps {
  progress: number;
}

function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="w-full bg-[rgba(0,0,0,0.06)] rounded h-2 my-2 overflow-hidden">
      <div className="bg-primary h-full duration-300" style={{ width: `${progress}%` }} />
    </div>
  );
}

interface ReplyInputProps {
  disabled?: boolean;
  onReplyText?: (text: string) => void;
  onReplyFile?: (fileId: string) => void;
}

export const ReplyInput = forwardRef<HTMLTextAreaElement, ReplyInputProps>(
  ({ disabled, onReplyText, onReplyFile }, ref) => {
    const [content, setContent] = useState('');

    const handleReplyText = () => {
      if (disabled) return;
      const text = content.trim();
      if (text) {
        onReplyText?.(text);
        setContent('');
      }
    };

    const handleTextareaKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleReplyText();
      }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { tasks, upload } = useUpload({
      onUploaded: (fileId) => {
        onReplyFile?.(fileId);
      },
    });

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      if (e.target.files?.length) {
        const file = e.target.files[0];
        e.target.value = '';
        upload(file);
      }
    };

    const uploadTask = tasks[0];

    return (
      <div className="flex p-[10px] pr-0 relative">
        <textarea
          ref={ref}
          className="grow resize-none outline-none border rounded-xl leading-4 pl-[10px] pr-8 py-2 text-sm focus:border-primary"
          placeholder="我想问..."
          rows={1}
          value={content}
          disabled={disabled}
          onChange={(e) => {
            e.target.style.height = '0';
            const maxHeight = Math.min(
              e.target.scrollHeight + 2, // 2 for border
              5 * 16 + 16, // 5 lines, 16 for leading, 16 for padding
            );
            e.target.style.height = maxHeight + 'px';
            setContent(e.target.value);
          }}
          onKeyDown={handleTextareaKeyDown}
        />
        <button
          className="flex text-[rgb(157,163,174)] disabled:text-[rgb(210,213,218)] w-8 h-8 absolute right-[42px] top-[11px]"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            onChange={handleFileInputChange}
          />
          <PiPaperclipHorizontal className="m-auto w-5 h-5 rotate-90" />
        </button>
        <button
          className="w-8 h-8 flex mx-1 text-primary disabled:text-[rgb(210,213,218)] mt-[1px]"
          disabled={disabled || !content.trim()}
          onClick={handleReplyText}
        >
          <PiPaperPlaneRightFill className="w-5 h-5 m-auto" />
        </button>
        {uploadTask && (
          <div className="absolute inset-0 bg-white px-4 flex items-center">
            <ProgressBar progress={uploadTask.progress} />
          </div>
        )}
      </div>
    );
  },
);
