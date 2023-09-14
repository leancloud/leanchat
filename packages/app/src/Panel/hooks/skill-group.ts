import { useQuery } from '@tanstack/react-query';

import { getSkillGroup, getSkillGroups } from '../api/skill-group';

export function useSkillGroups() {
  return useQuery({
    queryKey: ['SkillGroups'],
    queryFn: getSkillGroups,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSkillGroup(id: string) {
  return useQuery({
    queryKey: ['SkillGroup', id],
    queryFn: () => getSkillGroup(id),
  });
}
