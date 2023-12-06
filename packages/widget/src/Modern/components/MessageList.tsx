import { ReactNode, memo } from 'react';
import { PiFile } from 'react-icons/pi';
import Markdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import cx from 'classnames';

import { Message, MessageType, UserType } from '../../types';
import { bytesToSize } from '../helpers';

interface MessageBubbleProps {
  children?: ReactNode;
  isVisitor?: boolean;
}

function MessageBubble({ children, isVisitor }: MessageBubbleProps) {
  return (
    <div
      className={cx('p-2 rounded-md max-w-[95%] min-w-[36px]', {
        'bg-[rgb(243,244,246)] text-[rgb(83,90,103)]': !isVisitor,
        'bg-primary text-text': isVisitor,
      })}
    >
      {children}
    </div>
  );
}

interface FileMessageProps {
  file: {
    name: string;
    mime?: string;
    size?: number;
    url: string;
  };
}

function FileMessage({ file }: FileMessageProps) {
  if (file.mime && file.mime.startsWith('image/')) {
    return (
      <a href={file.url} target="_blank">
        <img className="h-[80px] object-contain" src={file.url} />
      </a>
    );
  }
  return (
    <div className="flex items-center border rounded-md px-3 py-2 max-w-[95%] text-[rgb(83,90,103)]">
      <PiFile className="w-7 h-7 shrink-0" />
      <div className="ml-2 overflow-hidden text-sm">
        <div className="truncate" title={file.name}>
          {file.name}
        </div>
        <div className="flex text-xs">
          <div className="mr-auto">{bytesToSize(file.size || 0)}</div>
          <a className="text-primary" href={file.url} target="_blank">
            下载
          </a>
        </div>
      </div>
    </div>
  );
}

interface LogMessageProps {
  content: string;
}

function LogMessage({ content }: LogMessageProps) {
  return (
    <div className="w-full text-xs text-[rgb(176,180,189)] flex justify-center items-center h-9">
      <div className="border-t w-full absolute" />
      <div className="bg-white px-2 absolute">{content}</div>
    </div>
  );
}

const markdownComponents: Components = {
  a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

interface MessageItemProps {
  message: Message;
}

const MessageItem = memo(({ message }: MessageItemProps) => {
  switch (message.type) {
    case MessageType.Message:
      if (message.data.text) {
        return (
          <MessageBubble isVisitor={message.from.type === UserType.Visitor}>
            <Markdown
              className="text-sm whitespace-pre-line break-all"
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.data.text}
            </Markdown>
          </MessageBubble>
        );
      }
      if (message.data.file) {
        return <FileMessage file={message.data.file} />;
      }
      break;
    case MessageType.Evaluation:
      return <LogMessage content="感谢您的评价" />;
    case MessageType.Close:
      return <LogMessage content="会话已结束" />;
    case MessageType.Reopen:
      return <LogMessage content="会话重新开启" />;
  }
});

interface MessageListProps {
  messages?: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  if (!messages || messages.length === 0) {
    return;
  }

  return (
    <div className="space-y-[10px]">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cx('flex', {
            'flex-row-reverse': message.from.type === UserType.Visitor,
          })}
        >
          <MessageItem message={message} />
        </div>
      ))}
    </div>
  );
}
