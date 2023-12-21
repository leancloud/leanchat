import { Empty, Spin } from 'antd';
import { AiFillWechat } from 'react-icons/ai';
import { MdMonitor } from 'react-icons/md';
import cx from 'classnames';

import { ConversationItem, ConversationItemProps } from './ConversationItem';
import { NowProvider } from '../contexts/NowContext';
import { Channel, ConversationStatus } from '../types';

export interface BaseConversation {
  id: string;
  channel: Channel;
  status: ConversationStatus;
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
  fetchingNextPage?: boolean;
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
  fetchingNextPage,
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
        return (
          <button key={conv.id} onClick={() => onClick(conv)}>
            <ConversationItem
              conversation={conv}
              active={conv.id === activeConversation}
              avatar={
                <div
                  className={cx('w-8 h-8 bg-gray-200 rounded-full shrink-0 flex', {
                    'bg-[#00c250]': conv.channel === Channel.WeChat,
                  })}
                >
                  {conv.channel === Channel.LiveChat && (
                    <MdMonitor className="w-5 h-5 m-auto text-gray-500" />
                  )}
                  {conv.channel === Channel.WeChat && (
                    <AiFillWechat className="w-5 h-5 m-auto text-white" />
                  )}
                </div>
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
        disabled={!hasNextPage || fetchingNextPage}
        onClick={() => onFetchNextPage?.()}
      >
        {fetchingNextPage ? '加载中' : hasNextPage ? '加载更多' : '没有更多'}
      </button>
    </>
  );

  if (unreadAlert) {
    return <NowProvider interval={1000}>{list}</NowProvider>;
  }

  return list;
}
