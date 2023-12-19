import { useMemo, useState } from 'react';
import { MdMenuOpen } from 'react-icons/md';
import cx from 'classnames';
import _ from 'lodash';
import { useToggle } from 'react-use';
import { useMutation } from '@tanstack/react-query';

import { Sider } from './Sider';
import { useConversations, useSetConversationQueryData } from '@/Panel/hooks/conversation';
import { useCurrentUser } from '@/Panel/auth';
import { Conversation } from './Conversation';
import { ConversationList } from './ConversationList';
import { useOperators } from '../hooks/operator';
import { Avatar } from '../components/Avatar';
import { GetConversationsOptions, reopenConversation } from '../api/conversation';
import { ConversationStatus } from '../types';

export default function Conversations() {
  const user = useCurrentUser();

  const [convOptions, setConvOptions] = useState<GetConversationsOptions>({
    status: ConversationStatus.Open,
    operatorId: user.id,
  });

  const [conversationId, setConversationId] = useState<string>();

  const {
    data: conversationsData,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = useConversations({ ...convOptions, desc: true });

  const conversations = useMemo(() => conversationsData?.pages.flat(), [conversationsData]);

  const setConvQueryData = useSetConversationQueryData();

  const [showSider, toggleSider] = useToggle(true);

  const { data: operators } = useOperators();

  const streamLabel = useMemo(() => {
    switch (convOptions.operatorId) {
      case user.id:
        return <span>我的</span>;
      case undefined:
        return <span>全部</span>;
      case null:
        return <span>未分配</span>;
      default:
        const operator = operators?.find((t) => t.id === convOptions.operatorId);
        if (operator) {
          return (
            <div className="flex items-center">
              <Avatar size={24} user={operator} />
              <div className="ml-3">{operator.internalName}</div>
            </div>
          );
        }
    }
  }, [operators, convOptions.operatorId]);

  const { mutate: reopen } = useMutation({
    mutationFn: reopenConversation,
  });

  return (
    <div className="h-full flex">
      <Sider
        show={showSider}
        operatorId={convOptions.operatorId}
        onChangeOperatorId={(operatorId) => setConvOptions((v) => ({ ...v, operatorId }))}
      />

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
        <div className="grow flex flex-col overflow-hidden">
          <div className="h-10 flex items-center border-b divide-x text-sm shrink-0">
            <button
              className={cx('flex-1 h-full', {
                'text-primary-600': convOptions.status === ConversationStatus.Open,
              })}
              onClick={() => setConvOptions((v) => ({ ...v, status: ConversationStatus.Open }))}
            >
              进行中
            </button>
            <button
              className={cx('flex-1 h-full', {
                'text-primary-600': convOptions.status === ConversationStatus.Closed,
              })}
              onClick={() => setConvOptions((v) => ({ ...v, status: ConversationStatus.Closed }))}
            >
              已完成
            </button>
          </div>
          <div className="grow flex flex-col overflow-y-auto">
            {conversations && (
              <ConversationList
                loading={isLoading}
                conversations={conversations}
                hasNextPage={hasNextPage}
                onFetchNextPage={fetchNextPage}
                onClick={(conv) => {
                  setConversationId(conv.id);
                  setConvQueryData(conv);
                }}
                activeConversation={conversationId}
                unreadAlert={
                  convOptions.operatorId === user.id &&
                  convOptions.status === ConversationStatus.Open
                }
                menu={
                  convOptions.operatorId === user.id &&
                  convOptions.status === ConversationStatus.Closed
                    ? {
                        items: [
                          {
                            key: 'reopen',
                            label: '重新打开',
                          },
                        ],
                        onClick: ({ conversation }) => reopen(conversation.id),
                      }
                    : undefined
                }
              />
            )}
          </div>
        </div>
      </div>

      <div className="grow bg-white overflow-hidden">
        {conversationId && (
          <Conversation
            key={conversationId}
            conversationId={conversationId}
            reopen={convOptions.operatorId === user.id}
            onReopen={() => reopen(conversationId)}
          />
        )}
      </div>
    </div>
  );
}
