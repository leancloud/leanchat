import { JSXElementConstructor, ReactNode } from 'react';
import cx from 'classnames';
import { Spin } from 'antd';

interface HeaderProps {
  Icon: JSXElementConstructor<{ className?: string }>;
  title: string;
  extra?: ReactNode;
}

function Header({ Icon, title, extra }: HeaderProps) {
  return (
    <div className="p-[20px] pb-0">
      <div className="mb-[20px] h-6 flex items-center">
        <Icon className="w-6 h-6 fill-[#647491]" />
        <span className="text-lg font-medium ml-3 mr-auto">{title}</span>
        {extra}
      </div>
      <hr className="border-[#eff2f6]" />
    </div>
  );
}

export interface ContainerProps {
  className?: string;
  header?: HeaderProps;
  children?: ReactNode;
  loading?: boolean;
}

export function Container({ className, header, children, loading }: ContainerProps) {
  return (
    <div
      className={cx(
        'bg-white rounded-md shadow-[rgba(0,27,71,0.08)_0px_3px_8px] max-w-[1280px]',
        className,
      )}
    >
      {header && <Header {...header} />}
      <div className="p-[20px]">
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Spin />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
