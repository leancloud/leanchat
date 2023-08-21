import { ComponentProps } from 'react';
import cx from 'classnames';
import { nanoid } from 'nanoid';

import { ChatBotNode } from '@/App/Panel/types';

function TriggerButton(props: ComponentProps<'button'>) {
  return <button {...props} className="bg-[#00a9ff] text-white px-2 py-1 rounded" />;
}

function ActionButton(props: ComponentProps<'button'>) {
  return <button {...props} className="bg-[#303f9f] text-white px-2 py-1 rounded" />;
}

interface NodePanelProps {
  show?: boolean;
  onToggle: () => void;
  onAddNode: (node: ChatBotNode) => void;
}

export function NodePanel({ show, onToggle, onAddNode }: NodePanelProps) {
  const content = (
    <>
      <div className="mb-2">事件</div>
      <div className="flex flex-wrap gap-2">
        <TriggerButton
          onClick={() =>
            onAddNode({
              id: nanoid(16),
              type: 'onConversationCreated',
            })
          }
        >
          创建对话
        </TriggerButton>
      </div>

      <div className="mt-4 mb-2">操作</div>
      <div className="flex flex-wrap gap-2">
        <ActionButton
          onClick={() =>
            onAddNode({
              id: nanoid(16),
              type: 'doSendMessage',
              message: {
                content: '',
              },
            })
          }
        >
          发送消息
        </ActionButton>
      </div>
    </>
  );

  return (
    <div
      className={cx('bg-white h-full rounded-md p-4 shadow-lg text-sm', {
        'w-[300px]': show,
      })}
    >
      <div className="flex flex-row-reverse">
        <button onClick={onToggle}>{show ? '隐藏' : '显示'}</button>
      </div>
      {show && content}
    </div>
  );
}
