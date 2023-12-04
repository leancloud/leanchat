import { useMutation, useQuery } from '@tanstack/react-query';

import {
  AutoCloseConfig,
  EvaluationConfig,
  GreetingMessageConfig,
  NoReadyOperatorMessageConfig,
  QueueConfig,
  getConfig,
  setConfig,
} from '../api/config';

interface ConfigKeys {
  greetingMessage: GreetingMessageConfig;
  noReadyOperatorMessage: NoReadyOperatorMessageConfig;
  autoClose: AutoCloseConfig;
  queue: QueueConfig;
  evaluation: EvaluationConfig;
}

interface UseConfigOptions {
  onSuccess?: () => void;
}

export function useConfig<T extends keyof ConfigKeys>(key: T, options?: UseConfigOptions) {
  const { data, isLoading } = useQuery({
    queryKey: ['Config', key],
    queryFn: () => getConfig<ConfigKeys[T]>(key),
  });

  const { mutate: update, isLoading: isUpdating } = useMutation({
    ...options,
    mutationFn: (value: ConfigKeys[T]) => setConfig(key, value),
  });

  return { data, isLoading, update, isUpdating };
}
