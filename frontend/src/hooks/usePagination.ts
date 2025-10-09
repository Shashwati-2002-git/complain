import { useState } from 'react';

/**
 * Custom hook for handling pagination
 * 
 * @param items - The array of items to paginate
 * @param itemsPerPage - Number of items per page
 * @returns Pagination state and functions
 */
export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    startItem: Math.min((currentPage - 1) * itemsPerPage + 1, items.length),
    endItem: Math.min(currentPage * itemsPerPage, items.length),
    totalItems: items.length
  };
}