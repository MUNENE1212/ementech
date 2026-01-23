/**
 * useSocialAccounts hook
 * Fetches and manages social account data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialService } from '../services';
import type { SocialAccount } from '../types';

export const useSocialAccounts = () => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['socialAccounts'],
    queryFn: () => socialService.getAccounts(),
    staleTime: 60000, // 1 minute
  });

  const connectMutation = useMutation({
    mutationFn: (platform: string) => socialService.connectAccount(platform),
  });

  const disconnectMutation = useMutation({
    mutationFn: (id: string) => socialService.disconnectAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialAccounts'] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => socialService.syncAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialAccounts'] });
    },
  });

  return {
    accounts: data || [],
    isLoading,
    isError,
    error,
    refetch,
    connectAccount: connectMutation.mutateAsync,
    disconnectAccount: disconnectMutation.mutateAsync,
    syncAccount: syncMutation.mutateAsync,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    isSyncing: syncMutation.isPending,
  };
};
