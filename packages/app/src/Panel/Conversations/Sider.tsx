import { ComponentProps, ReactNode, useMemo } from 'react';
import { FaUserCheck, FaUser, FaUserGroup } from 'react-icons/fa6';
import { Transition } from '@headlessui/react';
import { Popover } from 'antd';
import cx from 'classnames';

import { useOperators } from '../hooks/operator';
import { Avatar } from '../components/Avatar';
import { useScrolled } from '../hooks/useScrolled';
import { useCurrentUser } from '../auth';
import { OperatorRole } from '../types';
import { OperatorProfile } from './components/OperatorProfile';

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

interface SectionProps {
  title: string;
  children?: ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <>
      <div className="text-xs text-[#a8a8a8] mb-3 px-5">{title}</div>
      <div className="flex flex-col mb-5 px-2">{children}</div>
    </>
  );
}

interface TeamSectionProps {
  activeOperatorId?: string;
  onClick: (operatorId: string) => void;
}

function TeamSection({ activeOperatorId, onClick }: TeamSectionProps) {
  const { data: operators } = useOperators();
  const user = useCurrentUser();

  const members = useMemo(() => operators?.filter((o) => o.id !== user.id), [operators, user]);

  return (
    <Section title="团队">
      {members?.map((operator) => (
        <Popover
          key={operator.id}
          placement="rightTop"
          arrow={false}
          mouseEnterDelay={1}
          destroyTooltipOnHide
          content={() => <OperatorProfile operatorId={operator.id} />}
        >
          <SiderButton
            active={operator.id === activeOperatorId}
            onClick={() => onClick(operator.id)}
          >
            <Avatar size={20} user={operator} />
            <div className="ml-3"> {operator.internalName}</div>
          </SiderButton>
        </Popover>
      ))}
    </Section>
  );
}

interface SiderProps {
  operatorId?: string | null;
  onChangeOperatorId: (id?: string | null) => void;
  show?: boolean;
}

export function Sider({ operatorId, onChangeOperatorId, show = true }: SiderProps) {
  const { ref, scrolled } = useScrolled();
  const user = useCurrentUser();

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
          </div>
          <div ref={ref} className="overflow-y-auto">
            <Section title="会话">
              {[
                {
                  key: 'mine',
                  operatorId: user.id,
                  label: (
                    <div className="flex items-center">
                      <FaUserCheck className="w-4 h-4 mr-3" />
                      <span>我的</span>
                    </div>
                  ),
                },
                {
                  key: 'all',
                  operatorId: undefined,
                  label: (
                    <div className="flex items-center">
                      <FaUserGroup className="w-4 h-4 mr-3" />
                      <span>全部</span>
                    </div>
                  ),
                },
                {
                  key: 'unassigned',
                  operatorId: null,
                  label: (
                    <div className="flex items-center">
                      <FaUser className="w-4 h-4 mr-3" />
                      <span>未分配</span>
                    </div>
                  ),
                },
              ].map(({ key, operatorId: opId, label }) => (
                <SiderButton
                  key={key}
                  active={opId === operatorId}
                  onClick={() => onChangeOperatorId(opId)}
                >
                  {label}
                </SiderButton>
              ))}
            </Section>

            {user.role === OperatorRole.Admin && (
              <TeamSection
                activeOperatorId={operatorId || undefined}
                onClick={onChangeOperatorId}
              />
            )}
          </div>
        </div>
      </div>
    </Transition>
  );
}
