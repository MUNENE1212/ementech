/**
 * useSocialPosts hook
 * Fetches and manages social post data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialService } from '../../services/admin';
import type { SocialPost, SocialFilters } from '../../types/admin';

export const useSocialPosts = (filters?: SocialFilters) => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['socialPosts', filters],
    queryFn: () => socialService.getPosts(filters),
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (post: Partial<SocialPost>) => socialService.createPost(post),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, post }: { id: string; post: Partial<SocialPost> }) =>
      socialService.updatePost(id, post),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => socialService.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => socialService.publishPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ id, scheduledFor }: { id: string; scheduledFor: string }) =>
      socialService.schedulePost(id, scheduledFor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
    },
  });

  return {
    posts: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError,
    error,
    refetch,
    createPost: createMutation.mutateAsync,
    updatePost: updateMutation.mutateAsync,
    deletePost: deleteMutation.mutateAsync,
    publishPost: publishMutation.mutateAsync,
    schedulePost: scheduleMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isPublishing: publishMutation.isPending,
  };
};
