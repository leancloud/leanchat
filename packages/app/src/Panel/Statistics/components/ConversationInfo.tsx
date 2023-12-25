import { AiOutlineClose } from 'react-icons/ai';

import { ConversationProvider } from '@/Panel/Conversations/providers/ConversationProvider';
import { ConversationDetail } from '@/Panel/Conversations/ConversationDetail';
import { MessageList } from '@/Panel/Conversations/MessageList';

interface ConversationInfoProps {
  conversationId?: string;
  onClose: () => void;
}

export function ConversationInfo({ conversationId, onClose }: ConversationInfoProps) {
  if (!conversationId) {
    return;
  }
  return (
    <div className="fixed inset-0 p-10 bg-[rgba(0,0,0,0.5)] overflow-auto z-10 flex">
      <div className="bg-white h-full mx-auto w-[1000px] rounded-lg shadow overflow-hidden flex flex-col">
        <div className="px-4 py-3 flex items-center border-b">
          <div className="mr-auto font-bold">会话详情</div>
          <button onClick={onClose}>
            <AiOutlineClose className="w-4 h-4" />
          </button>
        </div>
        <div className="grow overflow-hidden">
          <ConversationProvider conversationId={conversationId}>
            <div className="h-full grid grid-cols-3">
              <div className="col-span-2 overflow-hidden">
                <MessageList className="max-h-full" />
              </div>
              <div className="col-span-1 border-l">
                <ConversationDetail />
              </div>
            </div>
          </ConversationProvider>
        </div>
      </div>
    </div>
  );
}
