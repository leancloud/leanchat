import cx from 'classnames';

import { Operator } from '../types';

interface AvatarProps {
  size?: number;
  user: Operator;
}

export function Avatar({ size = 32, user }: AvatarProps) {
  return (
    <div
      className="bg-[#e7e7e7] rounded-full text-[#969696] flex relative"
      style={{
        width: size,
        height: size,
      }}
    >
      <div
        className="m-auto"
        style={{
          fontSize: Math.floor(size * 0.6),
          lineHeight: Math.floor(size * 0.6) + 'px',
        }}
      >
        {user.internalName.slice(0, 1)}
      </div>
      <div
        className={cx(
          'w-[25%] h-[25%] rounded-full absolute right-0 bottom-0 outline outline-offset-0 outline-[10%] outline-white',
          {
            'bg-[#34b857]': user.status === 1,
            'bg-[#ffaf3d]': user.status === 2,
            'bg-[#e81332]': user.status === 3,
          },
        )}
      />
    </div>
  );
}
