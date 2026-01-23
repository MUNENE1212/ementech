/**
 * useLeads hook
 * Fetches and manages lead data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService } from '../services';
import type { Lead, LeadFilters } from '../types';

export const useLeads = (filters?: LeadFilters) => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['leads', filters],
    queryFn: () => leadService.getLeads(filters),
    staleTime: 30000, // 30 seconds
  });

  const createMutation = useMutation({
    mutationFn: (lead: Partial<Lead>) => leadService.createLead(lead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, lead }: { id: string; lead: Partial<Lead> }) =>
      leadService.updateLead(id, lead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadService.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ leadId, employeeId }: { leadId: string; employeeId: string }) =>
      leadService.assignLead(leadId, employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  return {
    leads: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError,
    error,
    refetch,
    createLead: createMutation.mutateAsync,
    updateLead: updateMutation.mutateAsync,
    deleteLead: deleteMutation.mutateAsync,
    assignLead: assignMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAssigning: assignMutation.isPending,
  };
};
