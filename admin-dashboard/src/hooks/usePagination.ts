/**
 * usePagination hook
 * Manages pagination state
 */

import { useState, useCallback } from 'react';

interface UsePaginationProps {
  initialPage?: number;
  initialLimit?: number;
  totalPages?: number;
}

export const usePagination = ({
  initialPage = 1,
  initialLimit = 20,
  totalPages,
}: UsePaginationProps = {}) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const nextPage = useCallback(() => {
    setPage((p) => (totalPages === undefined ? p + 1 : Math.min(p + 1, totalPages)));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(p - 1, 1));
  }, []);

  const goToPage = useCallback((pageNum: number) => {
    setPage(Math.max(1, totalPages === undefined ? pageNum : Math.min(pageNum, totalPages)));
  }, [totalPages]);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setLimit(initialLimit);
  }, [initialPage, initialLimit]);

  return {
    page,
    limit,
    nextPage,
    prevPage,
    goToPage,
    changeLimit,
    reset,
    canGoNext: totalPages === undefined ? true : page < totalPages,
    canGoPrev: page > 1,
  };
};
