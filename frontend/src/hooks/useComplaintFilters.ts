import { useState } from 'react';
import { Complaint } from '../../contexts/ComplaintContext';

type FilterOptions = {
  status: string[];
  priority: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  searchQuery: string;
};

/**
 * Custom hook for filtering and searching complaints
 * @param complaints - The array of complaints to filter
 * @returns Filter state and filtered complaints
 */
export function useComplaintFilters(complaints: Complaint[]) {
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    priority: [],
    dateRange: {
      start: null,
      end: null
    },
    searchQuery: ''
  });

  // Apply filters to complaints
  const filteredComplaints = complaints.filter(complaint => {
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(complaint.status)) {
      return false;
    }

    // Priority filter
    if (filters.priority.length > 0 && !filters.priority.includes(complaint.priority)) {
      return false;
    }

    // Date range filter
    if (filters.dateRange.start) {
      const complaintDate = new Date(complaint.createdAt);
      if (complaintDate < filters.dateRange.start) {
        return false;
      }
    }
    if (filters.dateRange.end) {
      const complaintDate = new Date(complaint.createdAt);
      if (complaintDate > filters.dateRange.end) {
        return false;
      }
    }

    // Search query filter (case-insensitive)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        complaint.title.toLowerCase().includes(query) ||
        complaint.description.toLowerCase().includes(query) ||
        complaint.id.toLowerCase().includes(query) ||
        (complaint.userId && complaint.userId.toLowerCase().includes(query)) ||
        (complaint.category && complaint.category.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // Filter status handlers
  const toggleStatusFilter = (status: string) => {
    setFilters(prevFilters => {
      if (prevFilters.status.includes(status)) {
        // Remove status
        return {
          ...prevFilters,
          status: prevFilters.status.filter(s => s !== status)
        };
      } else {
        // Add status
        return {
          ...prevFilters,
          status: [...prevFilters.status, status]
        };
      }
    });
  };

  // Filter priority handlers
  const togglePriorityFilter = (priority: string) => {
    setFilters(prevFilters => {
      if (prevFilters.priority.includes(priority)) {
        // Remove priority
        return {
          ...prevFilters,
          priority: prevFilters.priority.filter(p => p !== priority)
        };
      } else {
        // Add priority
        return {
          ...prevFilters,
          priority: [...prevFilters.priority, priority]
        };
      }
    });
  };

  // Date range filter handlers
  const setDateRange = (start: Date | null, end: Date | null) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      dateRange: { start, end }
    }));
  };

  // Search query handler
  const setSearchQuery = (query: string) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      searchQuery: query
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: [],
      priority: [],
      dateRange: {
        start: null,
        end: null
      },
      searchQuery: ''
    });
  };

  return {
    filters,
    filteredComplaints,
    toggleStatusFilter,
    togglePriorityFilter,
    setDateRange,
    setSearchQuery,
    clearFilters
  };
}