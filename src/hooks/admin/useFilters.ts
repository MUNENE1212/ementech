/**
 * useFilters hook
 * Manages filter state
 */

import { useState, useCallback } from 'react';

export const useFilters = <T extends Record<string, any>>(initialFilters: T) => {
  const [filters, setFilters] = useState<T>(initialFilters);

  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const clearFilter = useCallback(<K extends keyof T>(key: K) => {
    setFilters((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  }, []);

  const hasActiveFilters = Object.keys(filters).some(
    (key) => filters[key] !== undefined && filters[key] !== null && filters[key] !== ''
  );

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    clearFilter,
    hasActiveFilters,
  };
};
