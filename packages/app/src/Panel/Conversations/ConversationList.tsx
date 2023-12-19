import { Avatar, Empty, Spin } from 'antd';

import { ConversationItem, ConversationItemProps } from './ConversationItem';
import { NowProvider } from '../contexts/NowContext';

export interface BaseConversation {
  id: string;
  visitorId: string;
  visitor?: {
    name?: string;
  };
  lastMessage?: {
    data: Record<string, any>;
    createdAt: string;
  };
  evaluation?: {
    star: number;
  };
  visitorWaitingSince?: string;
}

interface ConversationListProps<T> {
  loading?: boolean;
  conversations?: T[];
  hasNextPage?: boolean;
  onFetchNextPage?: () => void;
  onClick: (conv: T) => void;
  activeConversation?: string;
  unreadAlert?: boolean;
  menu?: ConversationItemProps<T>['menu'];
}

export function ConversationList<T extends BaseConversation>({
  loading,
  conversations,
  hasNextPage,
  onFetchNextPage,
  onClick,
  activeConversation,
  unreadAlert,
  menu,
}: ConversationListProps<T>) {
  if (loading) {
    return (
      <div className="h-full flex justify-center items-center">
        <Spin />
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="py-20">
        <Empty description="暂无会话" />
      </div>
    );
  }

  const list = (
    <>
      {conversations.map((conv) => {
        const avatarColor = '#' + conv.visitorId.slice(-6);

        return (
          <button key={conv.id} onClick={() => onClick(conv)}>
            <ConversationItem
              conversation={conv}
              active={conv.id === activeConversation}
              avatar={
                <Avatar className="shrink-0" style={{ backgroundColor: avatarColor }}>
                  {conv.id.slice(0, 1)}
                </Avatar>
              }
              title={conv.visitor?.name || `用户${conv.visitorId.slice(-6)}`}
              message={
                conv.lastMessage &&
                (conv.lastMessage.data.file ? '[文件]' : conv.lastMessage.data.text)
              }
              unreadAlert={unreadAlert}
              menu={menu}
            />
          </button>
        );
      })}

      <button
        className="h-12 text-sm shrink-0 disabled:text-[#a8a8a8]"
        disabled={!hasNextPage}
        onClick={() => onFetchNextPage?.()}
      >
        {hasNextPage ? '加载更多' : '没有更多'}
      </button>
    </>
  );

  if (unreadAlert) {
    return <NowProvider interval={1000}>{list}</NowProvider>;
  }

  return list;
}
