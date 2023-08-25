import { FaUserCheck, FaUser, FaUserGroup, FaMagnifyingGlass } from 'react-icons/fa6';
import cx from 'classnames';

interface SiderProps {
  stream: string;
  onChangeStream: (stream: string) => void;
}

export function Sider({ stream, onChangeStream }: SiderProps) {
  return (
    <div className="flex h-full">
      <div className="w-[250px] grid grid-rows-[70px_1fr]">
        <div className="shrink-0 box-content flex items-center px-5">
          <div className="text-[20px] font-medium mr-auto">收件箱</div>
          <button className="text-[#969696]">
            <FaMagnifyingGlass />
          </button>
        </div>
        <div className="overflow-y-auto">
          <div className="text-xs text-[#a8a8a8] mb-3 px-5">会话</div>
          <div className="flex flex-col mb-5 px-2">
            {[
              {
                key: 'myOpen',
                label: (
                  <div className="flex items-center">
                    <FaUserCheck className="w-4 h-4 mr-3" />
                    <span>我的</span>
                  </div>
                ),
              },
              {
                key: 'allOperators',
                label: (
                  <div className="flex items-center">
                    <FaUserGroup className="w-4 h-4 mr-3" />
                    <span>全部</span>
                  </div>
                ),
              },
              {
                key: 'unassigned',
                label: (
                  <div className="flex items-center">
                    <FaUser className="w-4 h-4 mr-3" />
                    <span>未分配</span>
                  </div>
                ),
              },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={cx('flex px-3 py-2 text-sm border', {
                  'text-[#969696] border-transparent': stream !== key,
                  'text-[#3884F7] border-[#ececec] rounded-md': stream === key,
                })}
                onClick={() => onChangeStream(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
