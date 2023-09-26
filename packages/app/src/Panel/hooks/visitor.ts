import { useMutation, useQuery } from '@tanstack/react-query';
import { UpdateVisitorData, getVisitor, updateVisitor } from '../api/visitor';

export function useVisitor(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['Visitor', id],
    queryFn: () => getVisitor(id),
  });

  const { mutate: update, isLoading: isUpdating } = useMutation({
    mutationFn: (data: UpdateVisitorData) => updateVisitor(id, data),
  });

  return { data, isLoading, update, isUpdating };
}
