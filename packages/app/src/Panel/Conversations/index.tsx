import { useMemo, useState } from 'react';
import { MdMenuOpen } from 'react-icons/md';
import cx from 'classnames';
import _ from 'lodash';
import { useToggle } from 'react-use';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { Sider } from './Sider';
import { useSetConversationQueryData } from '@/Panel/hooks/conversation';
import { useCurrentUser } from '@/Panel/auth';
import { Conversation } from './Conversation';
import { ConversationList } from './ConversationList';
import { useOperators } from '../hooks/operator';
import { Avatar } from '../components/Avatar';
import { reopenConversation, searchConversation } from '../api/conversation';
import { ConversationStatus } from '../types';

export default function Conversations() {
  const user = useCurrentUser();

  const [conversationId, setConversationId] = useState<string>();

  const [searchOptions, setSearchOptions] = useState({
    status: ConversationStatus.Open,
    operatorId: user.id as string | null | undefined,
  });

  const {
    data: searchResult,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['Conversations', searchOptions],
    queryFn: ({ pageParam }) =>
      searchConversation({
        ...searchOptions,
        to: pageParam && dayjs(pageParam).subtract(1, 'ms').toISOString(),
        pageSize: 10,
        desc: true,
      }),
    getNextPageParam: (lastPage) => {
      return _.last(lastPage.data)?.createdAt;
    },
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60,
  });

  const conversations = useMemo(
    () => searchResult?.pages.flatMap((page) => page.data),
    [searchResult],
  );

  const setConvQueryData = useSetConversationQueryData();

  const [showSider, toggleSider] = useToggle(true);

  const { data: operators } = useOperators();

  const streamLabel = useMemo(() => {
    switch (searchOptions.operatorId) {
      case user.id:
        return <span>我的</span>;
      case undefined:
        return <span>全部</span>;
      case null:
        return <span>未分配</span>;
      default:
        const operator = operators?.find((t) => t.id === searchOptions.operatorId);
        if (operator) {
          return (
            <div className="flex items-center">
              <Avatar size={24} user={operator} />
              <div className="ml-3">{operator.internalName}</div>
            </div>
          );
        }
    }
  }, [operators, searchOptions.operatorId]);

  const { mutate: reopen } = useMutation({
    mutationFn: reopenConversation,
  });

  return (
    <div className="h-full flex">
      <Sider
        show={showSider}
        operatorId={searchOptions.operatorId}
        onChangeOperatorId={(operatorId) => setSearchOptions((v) => ({ ...v, operatorId }))}
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
                'text-primary-600': searchOptions.status === ConversationStatus.Open,
              })}
              onClick={() => setSearchOptions((v) => ({ ...v, status: ConversationStatus.Open }))}
            >
              进行中
            </button>
            <button
              className={cx('flex-1 h-full', {
                'text-primary-600': searchOptions.status === ConversationStatus.Closed,
              })}
              onClick={() => setSearchOptions((v) => ({ ...v, status: ConversationStatus.Closed }))}
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
                  searchOptions.operatorId === user.id &&
                  searchOptions.status === ConversationStatus.Open
                }
                menu={
                  searchOptions.operatorId === user.id &&
                  searchOptions.status === ConversationStatus.Closed
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
            reopen={searchOptions.operatorId === user.id}
            onReopen={() => reopen(conversationId)}
          />
        )}
      </div>
    </div>
  );
}
