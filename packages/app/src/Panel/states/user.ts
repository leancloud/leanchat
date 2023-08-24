import { atom, useRecoilState } from 'recoil';

const userStatusState = atom({
  key: 'userStatusState',
  default: 'leave',
});

export function useUserStatus() {
  return useRecoilState(userStatusState);
}
