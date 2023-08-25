import { BiBot, BiSolidUser } from 'react-icons/bi';
import cx from 'classnames';

interface AvatarProps {
  size?: number;
  type?: string;
  status?: string;
}

export function Avatar({ size = 32, type, status }: AvatarProps) {
  const Icon = type === 'chatbot' ? BiBot : BiSolidUser;

  return (
    <div
      className="bg-[#e7e7e7] rounded-full text-[#969696] flex relative"
      style={{
        width: size,
        height: size,
      }}
    >
      <Icon className="m-auto w-[60%] h-[60%]" />
      {status && (
        <div
          className={cx(
            'w-[25%] h-[25%] rounded-full absolute right-0 bottom-0 outline outline-offset-0 outline-[10%] outline-white',
            {
              'bg-[#34b857]': status === 'ready',
              'bg-[#d7dae1]': status === 'leave',
              'bg-[#e81332]': status === 'busy',
            },
          )}
        />
      )}
    </div>
  );
}
