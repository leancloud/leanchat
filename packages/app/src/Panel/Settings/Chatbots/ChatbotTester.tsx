import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Input } from 'antd';
import cx from 'classnames';

import { Chatbot } from '@/Panel/types';
import { TestChatbotData, testChatbot } from '@/Panel/api/chatbot';
import { useChatbotQuestionBases } from '@/Panel/hooks/chatbot';
import { MdMessage } from '@/Panel/Conversations/components/MdMessage';

interface TestMessage {
  isBot?: true;
  text: string;
}

export interface ChatbotTesterProps {
  chatbot: Chatbot;
}

export function ChatbotTester({ chatbot }: ChatbotTesterProps) {
  const [context, setContext] = useState<TestChatbotData['context']>({});
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<TestMessage[]>(() => [
    {
      isBot: true,
      text: chatbot.greetingMessage.text,
    },
  ]);

  const messageBoxRef = useRef<HTMLDivElement>(null!);

  const { mutate: test, isLoading } = useMutation({
    mutationFn: testChatbot,
    onSuccess: ({ context, text }) => {
      setContext(context);
      setMessages((messages) => [...messages, { isBot: true, text }]);
    },
  });

  const handleTest = () => {
    if (isLoading) return;
    const trimedInput = input.trim();
    if (trimedInput) {
      setInput('');
      setMessages((messages) => [...messages, { text: trimedInput }]);
      test({ id: chatbot.id, context, input: trimedInput });
    }
  };

  useEffect(() => {
    messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
  }, [messages]);

  const { data: bases } = useChatbotQuestionBases();

  const currentBaseNames = useMemo(() => {
    if (bases && context.questionBaseIds) {
      return context.questionBaseIds
        .map((id) => bases.find((base) => base.id === id))
        .map((base) => base?.name)
        .filter(Boolean);
    }
  }, [bases, context.questionBaseIds]);

  return (
    <div className="flex flex-col h-[70vh] overflow-auto">
      <div ref={messageBoxRef} className="grow space-y-2 overflow-auto my-2">
        {messages.map(({ text, isBot }, index) => (
          <div
            key={index}
            className={cx('clear-both px-2 py-1 rounded max-w-[95%]', {
              'float-left bg-gray-200': isBot,
              'float-right bg-primary text-white': !isBot,
            })}
          >
            <MdMessage>{text}</MdMessage>
          </div>
        ))}
      </div>
      <div>
        <div>当前问题库：{currentBaseNames?.join(',')}</div>
        <div className="mb-2">已执行分配客服操作：{context.operatorAssigned ? '是' : '否'}</div>
        <Input.TextArea
          autoSize
          placeholder="Enter 发送"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (e.shiftKey) {
                return;
              }
              e.preventDefault();
              handleTest();
            }
          }}
        />
      </div>
    </div>
  );
}
