import { ComponentProps } from 'react';
import { FaUserCheck, FaUser, FaUserGroup, FaMagnifyingGlass } from 'react-icons/fa6';
import { Transition } from '@headlessui/react';
import cx from 'classnames';

import { useOperators } from '../hooks/operator';
import { Avatar } from '../components/Avatar';
import { useScrolled } from '../hooks/useScrolled';

function SiderButton({ active, ...props }: ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      {...props}
      className={cx('flex px-3 py-2 text-sm border', {
        'text-[#969696] border-transparent': !active,
        'text-[#3884F7] border-[#ececec] rounded-md': active,
      })}
    />
  );
}

interface SiderProps {
  stream: string;
  onChangeStream: (stream: string) => void;
  show?: boolean;
}

export function Sider({ stream, onChangeStream, show = true }: SiderProps) {
  const { data: operators } = useOperators();

  const { ref, scrolled } = useScrolled();

  return (
    <Transition
      show={show}
      className="flex"
      enter="transition-[width] duration-300"
      enterFrom="w-0"
      enterTo="w-[250px]"
      leave="transition-[width] duration-300"
      leaveFrom="w-[250px]"
      leaveTo="w-0"
    >
      <div className="flex h-full">
        <div className="w-[250px] grid grid-rows-[70px_1fr] overflow-hidden">
          <div
            className={cx('shrink-0 box-content flex items-center px-5', {
              shadow: scrolled,
            })}
          >
            <div className="text-[20px] font-medium mr-auto">收件箱</div>
            <button className="text-[#969696]">
              <FaMagnifyingGlass />
            </button>
          </div>
          <div ref={ref} className="overflow-y-auto">
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
                <SiderButton key={key} active={stream === key} onClick={() => onChangeStream(key)}>
                  {label}
                </SiderButton>
              ))}
            </div>

            <div className="text-xs text-[#a8a8a8] mb-3 px-5">团队</div>
            <div className="flex flex-col mb-5 px-2">
              {operators?.map((operator) => (
                <SiderButton
                  key={operator.id}
                  active={stream === `operator/${operator.id}`}
                  onClick={() => onChangeStream(`operator/${operator.id}`)}
                >
                  <Avatar size={20} status={operator.status} />
                  <div className="ml-3"> {operator.internalName}</div>
                </SiderButton>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
}
