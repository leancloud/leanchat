import { ReactNode, useMemo, useState } from 'react';
import { MdMenuOpen } from 'react-icons/md';
import { Empty, Spin } from 'antd';
import cx from 'classnames';
import _ from 'lodash';
import { useToggle } from 'react-use';

import { Sider } from './Sider';
import { useConversations, useSetConversationQueryData } from '@/Panel/hooks/conversation';
import { useCurrentUser } from '@/Panel/auth';
import { Conversation } from './Conversation';
import { ConversationList } from './ConversationList';
import { useOperators } from '../hooks/operator';
import { Avatar } from '../components/Avatar';
import { GetConversationsOptions } from '../api/conversation';

const STREAM_LABELS: Record<string, ReactNode> = {
  unassigned: (
    <>
      <span>未分配</span>
    </>
  ),
  myOpen: (
    <>
      <span>我的</span>
    </>
  ),
  allOpen: <span>全部</span>,
};

export default function Conversations() {
  const user = useCurrentUser();
  const [stream, setStream] = useState('myOpen');

  const getConvOptions = useMemo<GetConversationsOptions>(() => {
    if (stream === 'unassigned') {
      return {
        closed: false,
        operatorId: 'none',
        desc: true,
      };
    } else if (stream === 'myOpen') {
      return {
        closed: false,
        operatorId: user.id,
        desc: true,
      };
    } else if (stream === 'allOpen') {
      return {
        closed: false,
        desc: true,
      };
    } else if (stream.startsWith('operator/')) {
      return {
        closed: false,
        operatorId: stream.slice('operator/'.length),
        desc: true,
      };
    }
    throw 'unreachable';
  }, [stream, user]);

  const [conversationId, setConversationId] = useState<string>();

  const {
    data: conversationsData,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = useConversations(getConvOptions);

  const conversations = useMemo(() => conversationsData?.pages.flat(), [conversationsData]);

  const setConvQueryData = useSetConversationQueryData();

  const [showSider, toggleSider] = useToggle(true);

  const { data: operators } = useOperators();

  const streamLabel = useMemo(() => {
    if (stream in STREAM_LABELS) {
      return STREAM_LABELS[stream];
    }
    if (stream.startsWith('operator/')) {
      const operatorId = stream.slice('operator/'.length);
      const operator = operators?.find((t) => t.id === operatorId);
      if (operator) {
        return (
          <div className="flex items-center">
            <Avatar size={24} status={operator.status} />
            <div className="ml-3">{operator.internalName}</div>
          </div>
        );
      }
    }
  }, [stream, operators]);

  return (
    <div className="h-full flex">
      <Sider show={showSider} stream={stream} onChangeStream={setStream} />

      <div
        className={cx('w-[300px] border-x flex flex-col bg-white shrink-0 z-10', {
          'rounded-l-2xl': showSider,
          'border-l-0': !showSider,
        })}
      >
        <div className="px-5 border-b border-[#ededed]">
          <div className="h-[70px] font-medium text-[20px] flex items-center">
            <button
              className="mr-4 text-[#969696] p-1 rounded transition-colors hover:bg-[#f7f7f7]"
              onClick={toggleSider}
            >
              <MdMenuOpen
                className={cx('w-[22px] h-[22px] transition-transform duration-300', {
                  '-rotate-180': !showSider,
                })}
              />
            </button>
            {streamLabel}
          </div>
        </div>
        <div className="overflow-y-auto grow flex flex-col">
          {isLoading && (
            <div className="h-full flex justify-center items-center">
              <Spin />
            </div>
          )}
          {conversations && conversations.length === 0 && (
            <div className="py-20">
              <Empty description="暂无会话" />
            </div>
          )}
          {conversations && (
            <ConversationList
              conversations={conversations}
              onClick={(conv) => {
                setConversationId(conv.id);
                setConvQueryData(conv);
              }}
              activeConversation={conversationId}
              unreadAlert={stream === 'myOpen'}
            />
          )}
          {conversations && hasNextPage && (
            <button className="h-12 text-sm shrink-0" onClick={() => fetchNextPage()}>
              加载更多
            </button>
          )}
          {conversations && conversations.length > 0 && !hasNextPage && (
            <div className="text-center leading-[48px] text-sm text-[#a8a8a8]">没有更多</div>
          )}
        </div>
      </div>

      <div className="grow bg-white overflow-hidden">
        {conversationId && <Conversation key={conversationId} conversationId={conversationId} />}
      </div>
    </div>
  );
}
