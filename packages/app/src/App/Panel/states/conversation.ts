import { atom, useRecoilState } from 'recoil';

const queuedConversationCountState = atom({
  key: 'queuedConversationCountState',
  default: 0,
});

export function useQueuedConversationCount() {
  return useRecoilState(queuedConversationCountState);
}
