import { useEffect, useRef, useState } from 'react';
import {
  FaXmark,
  FaMinus,
  FaRegFaceSmile,
  FaImage,
  FaFolderOpen,
  FaStar,
  FaHeadset,
} from 'react-icons/fa6';

import { useMessages, useSendMessage } from '../chat';
import { ControlButton } from './components/ControlButton';
import { Message } from './components/Message';
import style from './index.module.css';
import { Textarea } from './components/Textarea';
import { useScrollToBottom } from '../useScrollToBottom';

export function Classic() {
  const [content, setContent] = useState('');

  const { messages } = useMessages();

  const sendMessage = useSendMessage();

  const { containerRef, scrollToBottom } = useScrollToBottom();

  useEffect(() => scrollToBottom(), [messages]);

  const textareaRef = useRef<HTMLTextAreaElement>(null!);

  const handleSendMessage = () => {
    const trimedContent = content.trim();
    if (trimedContent) {
      sendMessage(trimedContent);
      setContent('');
      textareaRef.current.focus();
    }
  };

  return (
    <div className="mr-4 mb-2 w-[415px] text-xs">
      <div className="h-[55px] relative">
        <div className="h-[43px] border border-[#5f6467] rounded-t-[5px] border-b-0 bg-gradient-to-b from-[#67b9f4] to-[#4697ef] absolute bottom-0 w-full flex items-center">
          <div className="ml-[80px] text-white font-bold">机器人客服</div>
        </div>
        <div className="w-[55px] h-[55px] border border-[#5f6467] absolute bottom-0 left-5 bg-white"></div>
        <div className="absolute text-white top-5 right-[5px] flex gap-[5px]">
          <button className="w-5 h-5 flex">
            <FaMinus className="w-4 h-4 m-auto" />
          </button>
          <button className="w-5 h-5 flex">
            <FaXmark className="w-4 h-4 m-auto" />
          </button>
        </div>
      </div>
      <div className="h-[465px] border border-t-0 border-[#5f6467] rounded-bl-[5px] flex flex-col overflow-hidden">
        <div ref={containerRef} className={style.messageContainer}>
          {messages.map((msg) => (
            <Message key={msg.id} type={msg.from.type === 'visitor' ? 'right' : 'left'}>
              {msg.data.content}
            </Message>
          ))}
        </div>
        <div className="bg-[#f9f9f9] border-t border-t-[#d5d5d5]">
          <div className="h-[29px] shrink-0 flex items-center px-3 text-[rgb(102,102,102)] gap-4">
            <ControlButton title="表情">
              <FaRegFaceSmile className="w-4 h-4" />
            </ControlButton>
            <ControlButton title="图片">
              <FaImage className="w-4 h-4" />
            </ControlButton>
            <ControlButton title="文件">
              <FaFolderOpen className="w-4 h-4" />
            </ControlButton>
            <ControlButton title="评价">
              <FaStar className="w-4 h-4" />
            </ControlButton>
            <ControlButton title="转人工">
              <FaHeadset className="w-4 h-4" />
            </ControlButton>
          </div>
          <div className="h-[95px] shrink-0 p-[1px]">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>
          <div className="h-10 flex items-center px-[10px]">
            <div className="ml-auto space-x-[10px]">
              <button className="h-6 px-[10px] hover:text-[rgb(0,95,234)]">结束会话</button>
              <button
                className="px-6 border border-[#cccccc] h-7 hover:bg-[#f1f1f1]"
                onClick={handleSendMessage}
              >
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
