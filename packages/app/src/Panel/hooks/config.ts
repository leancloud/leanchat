import { useMutation, useQuery } from '@tanstack/react-query';
import { getConfig, setConfig } from '../api/config';

export function useConfig<T>(key: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['Config', key],
    queryFn: () => getConfig<T>(key),
  });

  const { mutate: update, isLoading: isUpdating } = useMutation({
    mutationFn: (value: T) => setConfig(key, value),
  });

  return { data, isLoading, update, isUpdating };
}
