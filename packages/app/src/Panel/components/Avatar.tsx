import { AiOutlineUser } from 'react-icons/ai';
import { BiBot } from 'react-icons/bi';

interface AvatarProps {
  type: string;
}

export function Avatar({ type }: AvatarProps) {
  const Icon = type === 'chatbot' ? BiBot : AiOutlineUser;

  return (
    <div className="w-8 h-8 bg-[#E3E8EE] rounded-full text-[#394866] flex">
      <Icon className="m-auto" />
    </div>
  );
}
