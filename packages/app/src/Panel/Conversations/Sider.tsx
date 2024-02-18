import { ComponentProps, ReactNode, useMemo, useState } from 'react';
import { FaUserCheck, FaUser, FaUserGroup } from 'react-icons/fa6';
import { BiChevronRight, BiChevronDown } from 'react-icons/bi';
import { Transition } from '@headlessui/react';
import { Popover } from 'antd';
import cx from 'classnames';
import _ from 'lodash';

import { useOperators } from '../hooks/operator';
import { useOperatorGroups } from '../hooks/operator-group';
import { Avatar } from '../components/Avatar';
import { useScrolled } from '../hooks/useScrolled';
import { useCurrentUser } from '../auth';
import { Operator, OperatorRole } from '../types';
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

interface OperatorButtonProps {
  operator: Operator;
  active?: boolean;
  onClick?: () => void;
}

function OperatorButton({ operator, active, onClick }: OperatorButtonProps) {
  return (
    <Popover
      placement="rightTop"
      arrow={false}
      mouseEnterDelay={1}
      destroyTooltipOnHide
      content={() => <OperatorProfile operatorId={operator.id} />}
    >
      <SiderButton active={active} onClick={onClick}>
        <Avatar size={20} user={operator} />
        <div className="ml-3"> {operator.internalName}</div>
      </SiderButton>
    </Popover>
  );
}

interface SectionProps {
  title: string;
  children?: ReactNode;
  collapsable?: boolean;
}

function Section({ title, children, collapsable }: SectionProps) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div>
      {collapsable ? (
        <button
          className={cx(
            'w-full text-left flex items-center text-xs text-[#a8a8a8] px-5',
            expanded ? 'mb-3' : 'mb-2',
          )}
          onClick={() => setExpanded(!expanded)}
          title={title}
        >
          <div className="truncate">{title}</div>
          {expanded ? (
            <BiChevronDown className="w-4 h-4 shrink-0" />
          ) : (
            <BiChevronRight className="w-4 h-4 shrink-0" />
          )}
        </button>
      ) : (
        <div className="text-xs text-[#a8a8a8] mb-3 px-5">{title}</div>
      )}
      {expanded && <div className="flex flex-col mb-5 px-2">{children}</div>}
    </div>
  );
}

interface TeamSectionProps {
  activeOperatorId?: string;
  onClick: (operatorId: string) => void;
}

function TeamSection({ activeOperatorId, onClick }: TeamSectionProps) {
  const { data: operators } = useOperators({ inactive: false });
  const { data: groups } = useOperatorGroups();

  const operatorMap = useMemo(() => _.keyBy(operators, (o) => o.id), [operators]);
  const groupList = useMemo(() => {
    return groups
      ?.map((group) => ({
        key: group.id,
        name: group.name,
        members: group.operatorIds.map((id) => operatorMap[id]).filter(Boolean),
      }))
      .filter((group) => group.members.length > 0);
  }, [groups, operatorMap]);

  const isolatedOperators = useMemo(() => {
    if (groups && operators) {
      const memberIdSet = new Set(groups.flatMap((g) => g.operatorIds));
      const isolatedOperators = operators.filter((o) => !memberIdSet.has(o.id));
      if (isolatedOperators.length) {
        return isolatedOperators;
      }
    }
  }, [groups, operators]);

  return (
    <>
      {groupList?.map(({ key, name, members }) => (
        <Section key={key} title={name} collapsable>
          {members.map((operator) => (
            <OperatorButton
              key={operator.id}
              operator={operator}
              active={operator.id === activeOperatorId}
              onClick={() => onClick(operator.id)}
            />
          ))}
        </Section>
      ))}
      {isolatedOperators && (
        <Section title="未分组" collapsable>
          {isolatedOperators.map((operator) => (
            <OperatorButton
              key={operator.id}
              operator={operator}
              active={operator.id === activeOperatorId}
              onClick={() => onClick(operator.id)}
            />
          ))}
        </Section>
      )}
    </>
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
