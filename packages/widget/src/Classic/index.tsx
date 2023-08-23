import { ComponentProps, ReactNode, KeyboardEvent, useState, useRef, useEffect } from 'react';
import Textarea from 'react-textarea-autosize';
import {
  FaXmark,
  FaMinus,
  FaRegFaceSmile,
  FaImage,
  FaFolderOpen,
  FaStar,
  FaHeadset,
  FaArrowLeft,
  FaPlus,
} from 'react-icons/fa6';
import cx from 'classnames';
import { useChat } from '../chat';
import { EvaluateData, Message } from '../types';

interface TextMessageProps {
  children?: ReactNode;
  position?: 'left' | 'right';
}

function TextMessage({ children, position = 'left' }: TextMessageProps) {
  return (
    <div
      className={cx('flex', {
        'flex-row-reverse': position === 'right',
      })}
    >
      <div
        className={cx(
          'bg-white text-[#6c6c6c] p-2 inline-block max-w-[85%] rounded-md min-w-[32px]',
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

interface LogMessageProps {
  content: string;
}

function LogMessage({ content }: LogMessageProps) {
  return (
    <div className="text-center">
      <div className="bg-[#E0E0E4] text-[#464647] inline-block rounded-full px-2 py-0.5">
        {content}
      </div>
    </div>
  );
}

interface MessageItemProps {
  message: Message;
}

function MessageItem({ message }: MessageItemProps) {
  if (message.type === 'message') {
    return (
      <TextMessage position={message.from.type === 'visitor' ? 'right' : 'left'}>
        {message.data.content}
      </TextMessage>
    );
  }
  if (message.type === 'log') {
    if (message.data.type === 'evaluated') {
      return <LogMessage content="消息提示：感谢您的评价" />;
    }
  }
}

function ControlButton(props: ComponentProps<'button'>) {
  return (
    <button
      {...props}
      className="text-[rgb(102,102,102)] enabled:hover:text-[rgb(54,103,144)] disabled:opacity-40"
    />
  );
}

function BigControlButton({ children, title, ...props }: ComponentProps<'button'>) {
  return (
    <button
      {...props}
      className="text-[rgb(102,102,102)] w-20 h-20 rounded disabled:opacity-40 flex flex-col justify-center items-center enabled:hover:shadow"
    >
      {children}
      <div className="text-xs mt-1">{title}</div>
    </button>
  );
}

interface MessageListProps {
  messages: Message[];
}

function MessageList({ messages }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const el = containerRef.current;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="grow flex flex-col p-4 pt-16 sm:pt-4 space-y-2 overflow-y-auto"
    >
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
    </div>
  );
}

interface EvaluationModalProps {
  onEvaluate: (star: number, feedback: string) => void;
  onCancel: () => void;
}

function EvaluationModal({ onEvaluate, onCancel }: EvaluationModalProps) {
  const [star, setStar] = useState(5);
  const [feedback, setFeedback] = useState('');

  const evaluations = ['非常不满意', '不满意', '一般', '满意', '非常满意'];

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.6)] flex">
      <div className="bg-white m-auto rounded-[5px] w-[80%] max-w-[400px]">
        <div className="flex flex-col items-center p-4">
          <div className="font-bold mb-4">请您评价我的服务</div>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((score) => (
              <button key={score} onClick={() => setStar(score)}>
                <FaStar
                  className={cx('w-9 h-9', {
                    'text-[rgb(240,188,94)]': star >= score,
                    'text-gray-300': star < score,
                  })}
                />
              </button>
            ))}
          </div>
          <div className="text-[rgb(240,188,94)] mt-2">{evaluations[star - 1]}</div>
          <div className="py-2 font-bold mt-4 mb-2">建议与反馈</div>
          <textarea
            className="border resize-none outline-none focus:border-[rgb(50,168,245)] w-full p-2"
            rows={3}
            placeholder="感谢您的反馈，我们会更加努力。"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>
        <div className="divide-x flex border-t text-[#32a8f5]">
          <button className="flex-1 h-12" onClick={onCancel}>
            取消
          </button>
          <button className="flex-1 h-12" onClick={() => onEvaluate(star, feedback)}>
            评价
          </button>
        </div>
      </div>
    </div>
  );
}

export function Classic() {
  const [content, setContent] = useState('');
  const [showControl, setShowControl] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);

  const handleShowEvaluation = () => {
    setShowEvaluationModal(true);
  };

  const { conversation, messages, sendMessage, evaluate } = useChat();

  const evaluated = !!conversation?.evaluation;

  const handleSendMessage = () => {
    const trimedContent = content.trim();
    if (trimedContent) {
      sendMessage(content);
      setContent('');
    }
  };

  const handleEvaluate = (data: EvaluateData) => {
    evaluate(data);
    setShowEvaluationModal(false);
  };

  const handleTextareaKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    if (!evaluated) {
      setShowEvaluationModal(true);
      return;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#f3f3f7] text-sm sm:text-xs sm:w-[415px] sm:max-h-[520px] sm:m-auto sm:border sm:border-[#5f6467] sm:rounded-[5px] sm:overflow-hidden">
      <div className="hidden shrink-0 h-[43px] bg-gradient-to-b from-[#67b9f4] to-[#4697ef] relative sm:flex items-center">
        <div className="ml-4 text-white font-bold">在线客服</div>
        <div className="absolute text-white top-2 right-[5px] flex gap-[5px]">
          <button className="w-5 h-5 flex hover:text-[rgb(232,162,65)]">
            <FaMinus className="w-4 h-4 m-auto" />
          </button>
          <button className="w-5 h-5 flex hover:text-[rgb(232,162,65)]" onClick={handleClose}>
            <FaXmark className="w-4 h-4 m-auto" />
          </button>
        </div>
      </div>
      <div className="relative grow flex flex-col overflow-hidden">
        <button className="sm:hidden absolute top-4 left-4 w-8 h-8 bg-white flex rounded-full bg-opacity-70 text-[#999999] shadow-sm">
          <FaArrowLeft className="m-auto" />
        </button>

        {!evaluated && (
          <button className="sm:hidden absolute top-4 right-4 w-8 h-8 bg-white flex rounded-full bg-opacity-70 text-[#999999] shadow-sm">
            <FaXmark className="m-auto" />
          </button>
        )}

        <MessageList messages={messages} />

        <div className="sm:hidden bg-[#f9f9f9]">
          <div className="p-[5px] flex">
            <Textarea
              className="grow resize-none outline-none border border-[#d4d4d4] rounded leading-4 px-[5px] py-3 focus:border-[#cef2ff]"
              placeholder="我想问..."
              maxRows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
            />
            {content ? (
              <button className="ml-2 mr-2 mt-auto h-[36px] mb-[3px] bg-[#cef2ff] px-2 rounded">
                发送
              </button>
            ) : (
              <button
                className="ml-2 mr-2 mt-auto h-[36px] w-[36px] mb-[3px] bg-[#cef2ff] px-2 rounded flex"
                onClick={() => setShowControl(!showControl)}
              >
                <FaPlus className="m-auto" />
              </button>
            )}
          </div>
          {showControl && (
            <div className="p-2 grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] justify-items-center gap-2">
              <BigControlButton title="图片">
                <FaImage className="w-8 h-8" />
              </BigControlButton>
              <BigControlButton title="文件">
                <FaFolderOpen className="w-8 h-8" />
              </BigControlButton>
              <BigControlButton title="评价" disabled={evaluated} onClick={handleShowEvaluation}>
                <FaStar className="w-8 h-8" />
              </BigControlButton>
              <BigControlButton title="转人工">
                <FaHeadset className="w-8 h-8" />
              </BigControlButton>
            </div>
          )}
        </div>

        <div className="hidden h-[29px] shrink-0 sm:flex items-center px-3 bg-[#f9f9f9] text-[rgb(102,102,102)] gap-4 border-t border-t-[#d5d5d5]">
          <ControlButton title="表情">
            <FaRegFaceSmile className="w-4 h-4" />
          </ControlButton>
          <ControlButton title="图片">
            <FaImage className="w-4 h-4" />
          </ControlButton>
          <ControlButton title="文件">
            <FaFolderOpen className="w-4 h-4" />
          </ControlButton>
          <ControlButton title="评价" disabled={evaluated} onClick={handleShowEvaluation}>
            <FaStar className="w-4 h-4" />
          </ControlButton>
          <ControlButton title="转人工">
            <FaHeadset className="w-4 h-4" />
          </ControlButton>
        </div>

        <div className="bg-[#f9f9f9] hidden shrink-0 sm:block">
          <div className="h-[95px] p-[2px]">
            <textarea
              className="resize-none w-full h-full outline-none p-[10px] leading-5 border border-[#d5d5d5] outline outline-0 outline-offset-0 outline-[#0088ff] focus:outline-1"
              placeholder="我想问..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
            />
          </div>

          <div className="flex h-10 items-center px-[10px]">
            <div className="ml-auto space-x-[10px]">
              <button className="h-6 px-[10px] hover:text-[rgb(0,95,234)]">结束会话</button>
              <button className="px-6 border rounded border-[#cccccc] h-7 hover:bg-[#f1f1f1]">
                发送
              </button>
            </div>
          </div>
        </div>

        {showEvaluationModal && (
          <EvaluationModal
            onCancel={() => setShowEvaluationModal(false)}
            onEvaluate={(star, feedback) => handleEvaluate({ star, feedback })}
          />
        )}
      </div>
    </div>
  );
}
