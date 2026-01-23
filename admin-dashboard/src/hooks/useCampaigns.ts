/**
 * useCampaigns hook
 * Fetches and manages campaign data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignService } from '../services';
import type { Campaign, CampaignFilters } from '../types';

export const useCampaigns = (filters?: CampaignFilters) => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['campaigns', filters],
    queryFn: () => campaignService.getCampaigns(filters),
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (campaign: Partial<Campaign>) => campaignService.createCampaign(campaign),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, campaign }: { id: string; campaign: Partial<Campaign> }) =>
      campaignService.updateCampaign(id, campaign),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignService.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => campaignService.sendCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => campaignService.pauseCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => campaignService.resumeCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  return {
    campaigns: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError,
    error,
    refetch,
    createCampaign: createMutation.mutateAsync,
    updateCampaign: updateMutation.mutateAsync,
    deleteCampaign: deleteMutation.mutateAsync,
    sendCampaign: sendMutation.mutateAsync,
    pauseCampaign: pauseMutation.mutateAsync,
    resumeCampaign: resumeMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSending: sendMutation.isPending,
  };
};
