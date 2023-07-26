import { atom, useRecoilState } from 'recoil';

export const unassignedCountState = atom({
  key: 'UnassignedCount',
  default: 0,
});

export function useUnassignedCount() {
  return useRecoilState(unassignedCountState);
}
