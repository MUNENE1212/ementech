/**
 * useSequences hook
 * Fetches and manages sequence data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sequenceService } from '../../services/admin';
import type { Sequence, SequenceFilters } from '../../types/admin';

export const useSequences = (filters?: SequenceFilters) => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sequences', filters],
    queryFn: () => sequenceService.getSequences(filters),
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (sequence: Partial<Sequence>) => sequenceService.createSequence(sequence),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, sequence }: { id: string; sequence: Partial<Sequence> }) =>
      sequenceService.updateSequence(id, sequence),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sequenceService.deleteSequence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => sequenceService.activateSequence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => sequenceService.pauseSequence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
    },
  });

  return {
    sequences: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError,
    error,
    refetch,
    createSequence: createMutation.mutateAsync,
    updateSequence: updateMutation.mutateAsync,
    deleteSequence: deleteMutation.mutateAsync,
    activateSequence: activateMutation.mutateAsync,
    pauseSequence: pauseMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
