import { ReactNode, useMemo } from 'react';
import { AiOutlineUser } from 'react-icons/ai';
import { Badge, Empty, Spin } from 'antd';
import cx from 'classnames';

import { Conversation } from '@/Panel/types';
import { NavMenu, NavMenuItem } from '@/Panel/components/NavMenu';
import { useOperators } from '@/Panel/hooks/operator';
import { ConversationList } from './ConversationList';

const LIVE_CONVERSATION_LABELS: Record<string, ReactNode> = {
  unassigned: (
    <>
      <span className="mr-3">👋</span>
      <span>未分配</span>
    </>
  ),
  myOpen: (
    <>
      <span className="mr-3">📬</span>
      <span>分配给我的</span>
    </>
  ),
  solved: (
    <>
      <span className="mr-3">✅</span>
      <span>已解决</span>
    </>
  ),
};

interface OperatorLabelProps {
  name: string;
  size?: 'large';
  status?: string;
}

function OperatorLabel({ name, size, status }: OperatorLabelProps) {
  return (
    <div className="flex items-center">
      <div
        className={cx('bg-gray-300 rounded-full flex relative', {
          'w-4 h-4': !size,
          'w-6 h-6': size === 'large',
        })}
      >
        <AiOutlineUser
          className={cx('m-auto text-gray-400', {
            'text-sm': !size,
            'text-[20px]': size === 'large',
          })}
        />
        {status && (
          <div
            className={cx(
              'absolute w-2 h-2 right-0 bottom-0 rounded-full translate-x-[25%] translate-y-[25%] border border-black',
              {
                'bg-[#34b857]': status === 'ready',
                'bg-[#d7dae1]': status === 'leave',
                'bg-[#e81332]': status === 'busy',
              },
            )}
          />
        )}
      </div>
      <div className="ml-2">{name}</div>
    </div>
  );
}

interface SiderProps {
  stream: string;
  onChangeStream: (stream: string) => void;
  conversations?: Conversation[];
  loading?: boolean;
  onClickConversation: (conv: Conversation) => void;
  activeConversation?: string;
}

export function Sider({
  stream,
  onChangeStream,
  conversations,
  loading,
  onClickConversation,
  activeConversation,
}: SiderProps) {
  const { data: operators } = useOperators();
  const operatorMenuItems = useMemo<NavMenuItem[]>(() => {
    return [
      {
        key: 'allOperators',
        label: '全部',
      },
      ...(operators || [])?.map((operator) => ({
        key: `operator/${operator.id}`,
        label: <OperatorLabel name={operator.internalName} status={operator.status} />,
      })),
    ];
  }, [operators]);

  const sectionLabel = useMemo(() => {
    if (stream in LIVE_CONVERSATION_LABELS) {
      return LIVE_CONVERSATION_LABELS[stream];
    }
    if (stream === 'allOperators') {
      return '全部';
    }
    if (stream.startsWith('operator/')) {
      const operatorId = stream.slice('operator/'.length);
      const operator = operators?.find((t) => t.id === operatorId);
      if (operator) {
        return <OperatorLabel name={operator.internalName} size="large" />;
      }
    }
  }, [stream, operators]);

  return (
    <div className="flex h-full">
      <div className="w-[232px] bg-[#21324e] flex flex-col">
        <div className="shrink-0 h-[60px] box-content border-b border-[#1c2b45] flex items-center px-[20px]">
          <div className="text-white text-[20px] font-medium">收件箱</div>
        </div>
        <div className="p-2 overflow-y-auto">
          <NavMenu
            inverted
            label="实时对话"
            items={[
              {
                key: 'unassigned',
                label: LIVE_CONVERSATION_LABELS['unassigned'],
                badge: <Badge count={0} size="small" />,
              },
              {
                key: 'myOpen',
                label: LIVE_CONVERSATION_LABELS['myOpen'],
              },
              {
                key: 'solved',
                label: LIVE_CONVERSATION_LABELS['solved'],
              },
            ]}
            activeKey={stream}
            onChange={onChangeStream}
          />

          <NavMenu
            inverted
            label="客服"
            items={operatorMenuItems}
            activeKey={stream}
            onChange={onChangeStream}
          />
        </div>
      </div>
      <div className="w-[320px] shadow-md flex flex-col">
        <div className="px-5 py-4 border-[#eff2f6] border-b">
          <h2 className="font-medium text-[20px] leading-7">{sectionLabel}</h2>
        </div>
        <div className="overflow-y-auto grow flex flex-col">
          {loading && (
            <div className="h-full flex justify-center items-center">
              <Spin />
            </div>
          )}
          {conversations?.length === 0 && (
            <div className="py-20">
              <Empty description="暂无会话" />
            </div>
          )}
          <ConversationList
            conversations={conversations}
            onClick={onClickConversation}
            activeConversation={activeConversation}
            unreadAlert={stream === 'myOpen'}
          />
        </div>
      </div>
    </div>
  );
}
