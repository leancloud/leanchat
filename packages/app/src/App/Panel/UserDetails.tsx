import { useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { Select } from 'antd';
import { MdOutlineClose } from 'react-icons/md';

import { callRpc, useSocket } from '@/socket';
import { useUserStatus } from './states/user';
import { useMutation } from '@tanstack/react-query';

interface UserDetailsProps {
  show: boolean;
  onToggle: () => void;
}

export function UserDetails({ show, onToggle }: UserDetailsProps) {
  const [status, setStatusState] = useUserStatus();
  const socket = useSocket();

  useEffect(() => {
    callRpc(socket, 'getStatus').then(setStatusState);
  }, []);

  const { mutate: setStatus } = useMutation({
    mutationFn: async (status: string) => {
      await callRpc(socket, 'setStatus', status);
    },
    onSuccess: (_data, status) => {
      setStatusState(status);
    },
  });

  return (
    <Transition
      show={show}
      className="absolute top-[60px] right-0 w-[305px] bg-[#1c2b45] h-[calc(100%-60px)] p-4 will-change-transform"
      enter="duration-500"
      enterFrom="translate-x-full"
      leave="duration-500"
      leaveTo="translate-x-full"
    >
      <div className="flex">
        <button className="ml-auto text-[#647491]" onClick={onToggle}>
          <MdOutlineClose className="w-6 h-6" />
        </button>
      </div>

      <div className="mt-5 flex flex-col items-center">
        <Select
          options={[
            { label: '在线', value: 'ready' },
            { label: '忙碌', value: 'busy' },
            { label: '离开', value: 'leave' },
          ]}
          value={status}
          onChange={(status) => setStatus(status)}
          style={{ width: 200 }}
        />
      </div>
    </Transition>
  );
}
