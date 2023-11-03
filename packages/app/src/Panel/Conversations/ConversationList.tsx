import { Avatar, Empty, Spin } from 'antd';

import { Conversation } from '@/Panel/types';
import { ConversationItem } from './ConversationItem';
import { NowProvider } from '../contexts/NowContext';

interface ConversationListProps {
  loading?: boolean;
  conversations?: Conversation[];
  hasNextPage?: boolean;
  onFetchNextPage?: () => void;
  onClick: (conv: Conversation) => void;
  activeConversation?: string;
  unreadAlert?: boolean;
}

export function ConversationList({
  loading,
  conversations,
  hasNextPage,
  onFetchNextPage,
  onClick,
  activeConversation,
  unreadAlert,
}: ConversationListProps) {
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
