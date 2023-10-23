import { ComponentProps, KeyboardEvent, useState, useRef, useEffect, ChangeEvent } from 'react';
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
  FaRegFile,
} from 'react-icons/fa6';
import cx from 'classnames';

import { useChat } from '../chat';
import { EvaluateData, Message } from '../types';
import { Modal } from './Modal';
import { ProgressMessage, TextMessage } from './Message';
import { UploadTask, useUpload } from './useUpload';
import { useAppContext } from '../AppContext';

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
        <img className="w-[100px] h-[100px] object-contain" src={file.url} />
      </a>
    );
  }
  return (
    <a className="flex items-center w-[200px] h-[30px]" href={file.url} target="_blank">
      <FaRegFile className="w-5 h-5 shrink-0 mx-1" />
      <div className="ml-1 grow truncate text-xs">{file.name}</div>
    </a>
  );
}

interface MessageItemProps {
  message: Message;
}

function MessageItem({ message }: MessageItemProps) {
  switch (message.type) {
    case 0:
      return (
        <TextMessage position={message.from.type === 0 ? 'right' : 'left'}>
          {message.data.file && <FileMessage file={message.data.file} />}
          {message.data.text}
        </TextMessage>
      );
    case 1:
      return <LogMessage content="消息提示：感谢您的评价" />;
    case 2:
      return <LogMessage content="会话已结束" />;
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
  uploadTasks: UploadTask[];
  isMobile?: boolean;
}

function MessageList({ messages, uploadTasks, isMobile }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const el = containerRef.current;
    el.scrollTop = el.scrollHeight;
  }, [messages, uploadTasks.length]);

  return (
    <div
      ref={containerRef}
      className={cx('grow flex flex-col p-4 space-y-2 overflow-y-auto', {
        'pt-16': isMobile,
      })}
    >
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
      {uploadTasks?.map((task) => <ProgressMessage key={task.id} progress={task.progress} />)}
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
    <Modal>
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
    </Modal>
  );
}

export function Classic() {
  const [content, setContent] = useState('');
  const [showControl, setShowControl] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const handleShowEvaluation = () => {
    setShowEvaluationModal(true);
  };

  const { status, conversation, messages, sendMessage, evaluate, close } = useChat({
    onInviteEvaluation: () => {
      setShowEvaluationModal(true);
    },
  });

  const isBusy = status === 'busy';

  const handleSendMessage = () => {
    const trimedContent = content.trim();
    if (trimedContent) {
      sendMessage({ text: content });
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
    if (conversation && !conversation.evaluation) {
      setShowEvaluationModal(true);
      return;
    }
    close();
  };

  const { tasks, upload } = useUpload({
    onUploaded: (fileId) => {
      sendMessage({ fileId });
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (!file) {
      return;
    }
    e.target.value = '';
    if (isBusy) {
      return;
    }
    upload(file);
  };

  const { iframe } = useAppContext();

  const toggleMinmize = () => {
    setMinimized(!minimized);
    if (minimized) {
      iframe.style.width = '415px';
      iframe.style.height = '520px';
    } else {
      iframe.style.width = '100px';
      iframe.style.height = '40px';
    }
  };

  const [isMobile, setIsMobile] = useState(() => {
    if (!window.top) {
      return false;
    }
    return window.top.matchMedia('(max-width: 668px)').matches;
  });

  useEffect(() => {
    const topWindow = window.top;
    if (!topWindow) return;
    const onResize = () => {
      setIsMobile(topWindow.matchMedia('(max-width: 668px)').matches);
    };
    topWindow.addEventListener('resize', onResize);
    return () => {
      topWindow.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      iframe.style.width = '100vw';
      iframe.style.height = '100vh';
    } else {
      iframe.style.width = '415px';
      iframe.style.height = '520px';
    }
  }, [isMobile]);

  if (minimized) {
    return (
      <button
        className="w-screen h-screen bg-[#e5e5e4] border border-[#c8c7c6] text-sm"
        onClick={toggleMinmize}
      >
        在线客服
      </button>
    );
  }

  return (
    <div
      className={cx('h-screen flex flex-col bg-[#f3f3f7] text-sm', {
        'text-xs border border-[#5f6467] rounded-[5px] overflow-hidden': !isMobile,
      })}
    >
      {!isMobile && (
        <div className="flex shrink-0 h-[43px] bg-gradient-to-b from-[#67b9f4] to-[#4697ef] relative items-center">
          <div className="ml-4 text-white font-bold">在线客服</div>
          <div className="absolute text-white top-2 right-[5px] flex gap-[5px]">
            <button className="w-5 h-5 flex hover:text-[rgb(232,162,65)]" onClick={toggleMinmize}>
              <FaMinus className="w-4 h-4 m-auto" />
            </button>
            <button className="w-5 h-5 flex hover:text-[rgb(232,162,65)]" onClick={handleClose}>
              <FaXmark className="w-4 h-4 m-auto" />
            </button>
          </div>
        </div>
      )}

      <div className="relative grow flex flex-col overflow-hidden">
        {isMobile && (
          <>
            <button className="absolute top-4 left-4 w-8 h-8 bg-white flex rounded-full bg-opacity-70 text-[#999999] shadow-sm">
              <FaArrowLeft className="m-auto" />
            </button>

            <button
              className="absolute top-4 right-4 w-8 h-8 bg-white flex rounded-full bg-opacity-70 text-[#999999] shadow-sm"
              onClick={handleClose}
            >
              <FaXmark className="m-auto" />
            </button>
          </>
        )}

        <MessageList messages={messages} uploadTasks={tasks} isMobile={isMobile} />

        {isMobile ? (
          <div className="bg-[#f9f9f9]">
            <input ref={fileInputRef} className="hidden" type="file" onChange={onFileInputChange} />
            <input
              ref={imageInputRef}
              className="hidden"
              type="file"
              accept="image/jpg,image/png,image/gif,image/jpeg,image/bmp"
              onChange={onFileInputChange}
            />
            <div className="p-[5px] flex">
              <Textarea
                className="grow resize-none outline-none border border-[#d4d4d4] rounded leading-4 px-[5px] py-3 focus:border-[#cef2ff]"
                placeholder="我想问..."
                maxRows={5}
                value={content}
                disabled={isBusy}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
              />
              {content ? (
                <button
                  className="ml-2 mr-2 mt-auto h-[36px] mb-[3px] bg-[#cef2ff] px-2 rounded"
                  onClick={handleSendMessage}
                >
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
                <BigControlButton
                  title="图片"
                  disabled={isBusy}
                  onClick={() => imageInputRef.current?.click()}
                >
                  <FaImage className="w-8 h-8" />
                </BigControlButton>
                <BigControlButton
                  title="文件"
                  disabled={isBusy}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FaFolderOpen className="w-8 h-8" />
                </BigControlButton>
                <BigControlButton
                  title="评价"
                  disabled={!!(!conversation || conversation.evaluation)}
                  onClick={handleShowEvaluation}
                >
                  <FaStar className="w-8 h-8" />
                </BigControlButton>
                <BigControlButton title="转人工" disabled>
                  <FaHeadset className="w-8 h-8" />
                </BigControlButton>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex h-[29px] shrink-0 items-center px-3 bg-[#f9f9f9] text-[rgb(102,102,102)] gap-4 border-t border-t-[#d5d5d5]">
              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                onChange={onFileInputChange}
              />
              <input
                ref={imageInputRef}
                className="hidden"
                type="file"
                accept="image/jpg,image/png,image/gif,image/jpeg,image/bmp"
                onChange={onFileInputChange}
              />
              <ControlButton title="表情" disabled={isBusy}>
                <FaRegFaceSmile className="w-4 h-4" />
              </ControlButton>
              <ControlButton
                title="图片"
                disabled={isBusy}
                onClick={() => imageInputRef.current?.click()}
              >
                <FaImage className="w-4 h-4" />
              </ControlButton>
              <ControlButton
                title="文件"
                disabled={isBusy}
                onClick={() => fileInputRef.current?.click()}
              >
                <FaFolderOpen className="w-4 h-4" />
              </ControlButton>
              <ControlButton
                title="评价"
                disabled={!!(!conversation || conversation.evaluation)}
                onClick={handleShowEvaluation}
              >
                <FaStar className="w-4 h-4" />
              </ControlButton>
              <ControlButton title="转人工" disabled>
                <FaHeadset className="w-4 h-4" />
              </ControlButton>
            </div>

            <div className="bg-[#f9f9f9] shrink-0">
              <div className="h-[95px] p-[2px]">
                <textarea
                  className="resize-none w-full h-full outline-none p-[10px] leading-5 border border-[#d5d5d5] outline outline-0 outline-offset-0 outline-[#0088ff] focus:outline-1"
                  placeholder="我想问..."
                  value={content}
                  disabled={isBusy}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                />
              </div>

              <div className="flex h-10 items-center px-[10px]">
                <div className="ml-auto space-x-[10px]">
                  <button
                    className="h-6 px-[10px] enabled:hover:text-[rgb(0,95,234)] disabled:text-gray-400"
                    disabled={!!(!conversation || conversation.closedAt)}
                    onClick={handleClose}
                  >
                    结束会话
                  </button>
                  <button
                    className="px-6 border rounded border-[#cccccc] h-7 enabled:hover:bg-[#f1f1f1] disabled:text-gray-400"
                    disabled={isBusy}
                    onClick={handleSendMessage}
                  >
                    发送
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

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
