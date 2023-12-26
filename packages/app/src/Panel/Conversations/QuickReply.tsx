import { useState } from 'react';
import { MdAdd, MdClose } from 'react-icons/md';
import { IoFlashOutline } from 'react-icons/io5';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Empty, Select } from 'antd';
import cx from 'classnames';
import _ from 'lodash';

import { getQuickReplies } from '../api/quick-reply';

interface QuickReplyProps {
  onSelect: (content: string) => void;
  onClose: () => void;
  keyword?: string;
}

export function QuickReply({ onSelect, onClose, keyword }: QuickReplyProps) {
  const { data: quickReplies } = useQuery({
    queryKey: ['QuickReplies'],
    queryFn: getQuickReplies,
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const [tagPath, setTagPath] = useState<string[]>([]);

  const filterQuickReplies = (path: string[], keyword?: string) => {
    if (!quickReplies) return [];
    keyword = keyword?.trim().toLowerCase();
    let result = quickReplies.filter((qr) => {
      if (!qr.tags) return false;
      return path.every((tag, i) => qr.tags![i] === tag);
    });
    if (keyword) {
      result = result.filter((qr) => qr.content.toLowerCase().includes(keyword!));
    }
    return result;
  };

  const getTagOptions = (path: string[]) => {
    const tags = filterQuickReplies(path)
      .map((qr) => qr.tags?.[path.length])
      .filter(Boolean);
    return _.uniq(tags).map((tag) => ({ label: tag, value: tag }));
  };

  const filteredQuickReplies = filterQuickReplies(tagPath, keyword);

  return (
    <div className="relative" tabIndex={-1}>
      <div className="absolute bottom-0 w-full z-10 p-1 text-sm">
        <div className="bg-white border shadow-md rounded">
          <div className="h-10 px-3 border-b flex items-center">
            <div className="font-medium mr-auto flex items-center">
              <IoFlashOutline className="mr-1" />
              快捷回复
            </div>
            <div className="flex items-center">
              <Link
                className="flex items-center px-1 text-[#3884f7] hover:underline"
                to="/settings/quick-replies?create=1"
              >
                <MdAdd className="w-4 h-4" />
                <span className="ml-1 text-xs">新回复</span>
              </Link>
              <hr className="mx-2 border-l h-4" />
              <button
                className="w-5 h-5 flex transition-colors hover:bg-[#f7f7f7] rounded text-[#969696]"
                onClick={onClose}
              >
                <MdClose className="m-auto w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4">
            <div className="h-[360px] border-r overflow-auto p-2 space-y-2">
              <Select
                className="w-full"
                placeholder="标签"
                options={getTagOptions([])}
                onChange={(tag) => setTagPath(tag ? [tag] : [])}
                showSearch
                allowClear
              />
              {tagPath.map((path, i) => {
                const options = getTagOptions(tagPath.slice(0, i + 1));
                if (options.length === 0) {
                  return null;
                }
                return (
                  <Select
                    key={`${path}.${i}`}
                    className="w-full"
                    placeholder={`标签${i + 2}`}
                    options={options}
                    value={tagPath[i + 1]}
                    onChange={(tag) =>
                      setTagPath((path) =>
                        tag ? [...path.slice(0, i + 1), tag] : path.slice(0, i + 1),
                      )
                    }
                    showSearch
                    allowClear
                  />
                );
              })}
            </div>
            <div
              className={cx('h-[360px] col-span-3 p-1 divide-y divide-dashed overflow-auto', {
                flex: filteredQuickReplies.length === 0,
              })}
            >
              {filteredQuickReplies.length === 0 && <Empty style={{ margin: 'auto' }} />}
              {filteredQuickReplies.map((quickReply) => (
                <button
                  key={quickReply.id}
                  className="p-2 w-full rounded text-left hover:bg-primary-100 outline-none"
                  onClick={() => onSelect(quickReply.content)}
                >
                  {quickReply.content}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
