import { ComponentProps } from 'react';
import cx from 'classnames';

import { ChatBotNode } from '@/App/Panel/types';

function TriggerButton(props: ComponentProps<'button'>) {
  return <button {...props} className="bg-[#00a9ff] text-white px-2 py-1 rounded" />;
}

function ActionButton(props: ComponentProps<'button'>) {
  return <button {...props} className="bg-red-500 text-white px-2 py-1 rounded" />;
}

interface NodePanelProps {
  show?: boolean;
  onToggle: () => void;
  onAddNode: (type: string, node: Partial<ChatBotNode>) => void;
}

export function NodePanel({ show, onToggle, onAddNode }: NodePanelProps) {
  const content = (
    <>
      <div className="mb-2">事件</div>
      <div className="flex flex-wrap gap-2">
        <TriggerButton
          onClick={() =>
            onAddNode('event', {
              type: 'onConversationCreated',
            })
          }
        >
          用户创建会话
        </TriggerButton>
        <TriggerButton
          onClick={() =>
            onAddNode('event', {
              type: 'onVisitorInactive',
            })
          }
        >
          用户未回复
        </TriggerButton>
      </div>

      <div className="mt-4 mb-2">操作</div>
      <div className="flex flex-wrap gap-2">
        <ActionButton
          onClick={() =>
            onAddNode('action', {
              type: 'doSendMessage',
              message: {
                content: '',
              },
            })
          }
        >
          发送消息
        </ActionButton>
        <ActionButton
          onClick={() =>
            onAddNode('action', {
              type: 'doCloseConversation',
            })
          }
        >
          关闭会话
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
