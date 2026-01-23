/**
 * useAnalytics hook
 * Fetches analytics data
 */

import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services/admin';

export const useAnalytics = (period?: string) => {
  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['analytics', 'overview', period],
    queryFn: () => analyticsService.getOverview(period),
    staleTime: 60000, // 1 minute
  });

  const {
    data: leads,
    isLoading: leadsLoading,
    error: leadsError,
  } = useQuery({
    queryKey: ['analytics', 'leads', period],
    queryFn: () => analyticsService.getLeadsAnalytics(period),
    staleTime: 60000,
  });

  const {
    data: email,
    isLoading: emailLoading,
    error: emailError,
  } = useQuery({
    queryKey: ['analytics', 'email', period],
    queryFn: () => analyticsService.getEmailAnalytics(period),
    staleTime: 60000,
  });

  const {
    data: sequences,
    isLoading: sequencesLoading,
    error: sequencesError,
  } = useQuery({
    queryKey: ['analytics', 'sequences', period],
    queryFn: () => analyticsService.getSequenceAnalytics(period),
    staleTime: 60000,
  });

  const {
    data: social,
    isLoading: socialLoading,
    error: socialError,
  } = useQuery({
    queryKey: ['analytics', 'social', period],
    queryFn: () => analyticsService.getSocialAnalytics(period),
    staleTime: 60000,
  });

  const {
    data: revenue,
    isLoading: revenueLoading,
    error: revenueError,
  } = useQuery({
    queryKey: ['analytics', 'revenue', period],
    queryFn: () => analyticsService.getRevenueAnalytics(period),
    staleTime: 60000,
  });

  const {
    data: funnel,
    isLoading: funnelLoading,
    error: funnelError,
  } = useQuery({
    queryKey: ['analytics', 'funnel', period],
    queryFn: () => analyticsService.getFunnelAnalytics(period),
    staleTime: 60000,
  });

  const {
    data: pipeline,
    isLoading: pipelineLoading,
  } = useQuery({
    queryKey: ['analytics', 'pipeline'],
    queryFn: () => analyticsService.getPipelineSnapshot(),
    staleTime: 30000,
  });

  return {
    overview,
    leads,
    email,
    sequences,
    social,
    revenue,
    funnel,
    pipeline,
    isLoading:
      overviewLoading ||
      leadsLoading ||
      emailLoading ||
      sequencesLoading ||
      socialLoading ||
      revenueLoading ||
      funnelLoading ||
      pipelineLoading,
    error: overviewError || leadsError || emailError || sequencesError || socialError || revenueError || funnelError,
    refetch: refetchOverview,
  };
};
