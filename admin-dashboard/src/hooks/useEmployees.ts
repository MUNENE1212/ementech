/**
 * useEmployees hook
 * Fetches and manages employee data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../services';
import type { User, EmployeeFilters } from '../types';

export const useEmployees = (filters?: EmployeeFilters) => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['employees', filters],
    queryFn: () => employeeService.getEmployees(filters),
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (employee: Partial<User>) => employeeService.createEmployee(employee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, employee }: { id: string; employee: Partial<User> }) =>
      employeeService.updateEmployee(id, employee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeService.deactivateEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: ({ email, role, options }: { email: string; role: string; options?: any }) =>
      employeeService.inviteEmployee(email, role, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  return {
    employees: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError,
    error,
    refetch,
    createEmployee: createMutation.mutateAsync,
    updateEmployee: updateMutation.mutateAsync,
    deleteEmployee: deleteMutation.mutateAsync,
    inviteEmployee: inviteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isInviting: inviteMutation.isPending,
  };
};
