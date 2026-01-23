/**
 * useTemplates hook
 * Fetches and manages email template data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateService } from '../../services/admin';
import type { EmailTemplate, TemplateFilters } from '../../types/admin';

export const useTemplates = (filters?: TemplateFilters) => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['templates', filters],
    queryFn: () => templateService.getTemplates(filters),
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (template: Partial<EmailTemplate>) => templateService.createTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, template }: { id: string; template: Partial<EmailTemplate> }) =>
      templateService.updateTemplate(id, template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templateService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => templateService.duplicateTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  return {
    templates: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError,
    error,
    refetch,
    createTemplate: createMutation.mutateAsync,
    updateTemplate: updateMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutateAsync,
    duplicateTemplate: duplicateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
  };
};
