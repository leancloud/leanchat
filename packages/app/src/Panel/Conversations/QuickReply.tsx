import {
  ComponentProps,
  KeyboardEvent,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { MdAdd, MdClose } from 'react-icons/md';
import { IoFlashOutline } from 'react-icons/io5';
import { useToggle } from 'react-use';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Empty } from 'antd';
import cx from 'classnames';

import { QuickReplyModal } from '@/Panel/Settings/QuickReplies';
import { createQuickReply, getQuickReplies } from '../api/quick-reply';
import { QuickReply as IQuickReply } from '../types';

interface TagButtonProps extends ComponentProps<'button'> {
  active?: boolean;
  count?: number;
}

function TagButton({ active, children, count = 0, ...props }: TagButtonProps) {
  return (
    <button
      {...props}
      className={cx(
        'w-full outline-none text-left transition-colors border-transparent border-l-2 p-2 flex items-center',
        {
          'bg-primary-100 border-l-primary-600': active,
          'hover:bg-gray-100': !active,
        },
        props.className,
      )}
    >
      <span className="truncate mr-auto">{children}</span>
      <span className="font-mono text-xs">{count}</span>
    </button>
  );
}

export interface QuickReplyRef {
  handleKeyDown: (e: KeyboardEvent) => boolean;
}

interface QuickReplyProps {
  onSelect: (content: string) => void;
  onClose: () => void;
  keyword?: string;
}

export const QuickReply = forwardRef<QuickReplyRef, QuickReplyProps>(
  ({ onSelect, onClose, keyword }, ref) => {
    const { data: quickReplies, refetch } = useQuery({
      queryKey: ['QuickReplies'],
      queryFn: getQuickReplies,
      staleTime: 1000 * 60 * 5,
    });

    const filteredQuickReplies = useMemo(() => {
      if (!quickReplies) {
        return [];
      }
      if (keyword) {
        const lowerCaseKeyword = keyword.toLowerCase();
        return quickReplies.filter((qr) => qr.content.toLowerCase().includes(lowerCaseKeyword));
      }
      return quickReplies;
    }, [quickReplies, keyword]);

    const quickRepliesByTag = useMemo(() => {
      const quickRepliesByTag: Record<string, IQuickReply[]> = {};
      filteredQuickReplies.forEach((quickReply) => {
        quickReply.tags?.forEach((tag) => {
          if (!quickRepliesByTag[tag]) {
            quickRepliesByTag[tag] = [];
          }
          quickRepliesByTag[tag].push(quickReply);
        });
      });
      return quickRepliesByTag;
    }, [filteredQuickReplies]);

    const [tagIndex, setTagIndex] = useState(-1);
    const [replyIndex, setReplyIndex] = useState(0);
    const [inTag, setInTag] = useState(true);

    useEffect(() => {
      setTagIndex(-1);
      setReplyIndex(0);
      setInTag(true);
    }, [filteredQuickReplies]);

    const tags = Object.keys(quickRepliesByTag);
    const currentQuickReplies =
      tagIndex >= 0 ? quickRepliesByTag[tags[tagIndex]] : filteredQuickReplies;

    const handleSelect = () => {
      const currentQuickReply = currentQuickReplies[replyIndex];
      if (currentQuickReply) {
        onSelect(currentQuickReply.content);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSelect();
        return true;
      }
      if (e.key === 'Escape') {
        onClose();
        return true;
      }
      if (inTag) {
        switch (e.key) {
          case 'ArrowUp':
            setTagIndex(Math.max(-1, tagIndex - 1));
            setReplyIndex(0);
            return true;
          case 'ArrowDown':
            setTagIndex(Math.min(tags.length - 1, tagIndex + 1));
            setReplyIndex(0);
            return true;
          case 'ArrowRight':
            setInTag(false);
            return true;
        }
      } else {
        switch (e.key) {
          case 'ArrowUp':
            setReplyIndex(Math.max(0, replyIndex - 1));
            return true;
          case 'ArrowDown':
            const max = currentQuickReplies ? currentQuickReplies.length - 1 : 0;
            setReplyIndex(Math.min(max, replyIndex + 1));
            return true;
          case 'ArrowLeft':
            setInTag(true);
            return true;
        }
      }
      return false;
    };

    useImperativeHandle(ref, () => ({ handleKeyDown }));

    const [showCreateModal, toggleCreateModal] = useToggle(false);

    const { mutate: create, isLoading: isCreating } = useMutation({
      mutationFn: createQuickReply,
      onSuccess: () => {
        refetch();
        toggleCreateModal();
      },
    });

    return (
      <div className="relative" onKeyDown={handleKeyDown} tabIndex={-1}>
        <div className="absolute bottom-0 w-full z-10 p-1 text-sm">
          <div className="bg-white border shadow-md rounded">
            <div className="h-10 px-3 border-b flex items-center">
              <div className="font-medium mr-auto flex items-center">
                <IoFlashOutline className="mr-1" />
                快捷回复
              </div>
              <div className="flex items-center">
                <button
                  className="flex items-center px-1 text-[#3884f7] hover:underline"
                  onClick={toggleCreateModal}
                >
                  <MdAdd className="w-4 h-4" />
                  <span className="ml-1 text-xs">新回复</span>
                </button>
                <hr className="mx-2 border-l h-4" />
                <button
                  className="w-5 h-5 flex transition-colors hover:bg-[#f7f7f7] rounded text-[#969696]"
                  onClick={onClose}
                >
                  <MdClose className="m-auto w-4 h-4" />
                </button>
              </div>
            </div>
            {filteredQuickReplies.length > 0 ? (
              <div className="grid grid-cols-4">
                <div className="h-[360px] border-r overflow-auto">
                  <TagButton
                    active={tagIndex < 0}
                    count={filteredQuickReplies.length}
                    onClick={() => {
                      if (tagIndex !== -1) {
                        setTagIndex(-1);
                        setReplyIndex(0);
                      }
                    }}
                  >
                    全部
                  </TagButton>
                  {tags.map((tag, index) => (
                    <TagButton
                      key={tag}
                      active={tagIndex === index}
                      count={quickRepliesByTag[tag].length}
                      onClick={() => {
                        if (tagIndex !== index) {
                          setTagIndex(index);
                          setReplyIndex(0);
                        }
                      }}
                    >
                      <span className="text-[#969696] mr-0.5">#</span>
                      {tag}
                    </TagButton>
                  ))}
                </div>
                <div className="h-[360px] col-span-3 p-1 divide-y divide-dashed overflow-auto">
                  {currentQuickReplies?.map((quickReply, index) => (
                    <button
                      key={quickReply.id}
                      className={cx('p-2 w-full rounded text-left transition-colors outline-none', {
                        'bg-primary-100': index === replyIndex && !inTag,
                        'bg-gray-100': index === replyIndex && inTag,
                      })}
                      onMouseMove={() => setReplyIndex(index)}
                      onClick={handleSelect}
                    >
                      {quickReply.content}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <Empty className="m-auto py-20" />
            )}
          </div>
        </div>

        <QuickReplyModal
          open={showCreateModal}
          onClose={toggleCreateModal}
          onSave={create}
          loading={isCreating}
        />
      </div>
    );
  },
);
