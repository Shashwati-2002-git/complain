/**
 * Dashboard Utility Functions
 * 
 * This file contains helper functions for dashboard components to maintain
 * consistent styling and behavior across different dashboard types.
 */

// Navigation item classes for sidebar links
export const getNavItemClasses = (isActive: boolean): string => {
  return isActive 
    ? 'bg-slate-700 text-white' 
    : 'text-slate-400 hover:text-white hover:bg-slate-700';
};

// Get status color classes for complaint/ticket status badges
export const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'resolved':
    case 'closed':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'in progress':
    case 'under review':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'escalated':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'open':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

// Get priority color classes for complaint/ticket priority badges
export const getPriorityColor = (priority: string): string => {
  switch (priority?.toLowerCase()) {
    case 'high':
    case 'urgent':
      return 'text-red-600 bg-red-50';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50';
    case 'low':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

// Get connection status color for socket connection indicator
export const getConnectionStatusColor = (isConnected: boolean): string => {
  return isConnected ? 'bg-green-500' : 'bg-red-500';
};

// Format a date or time value for display
export const formatDate = (date: Date | string | number | undefined): string => {
  if (!date) return 'N/A';
  
  const dateObject = new Date(date);
  
  if (isNaN(dateObject.getTime())) {
    return 'Invalid Date';
  }
  
  return dateObject.toLocaleString();
};

// Convert any value to a Date object safely
export const toDate = (value: string | number | Date | undefined): Date => {
  if (!value) {
    return new Date();
  }
  
  if (value instanceof Date) {
    return value;
  }
  
  const date = new Date(value);
  
  if (isNaN(date.getTime())) {
    return new Date();
  }
  
  return date;
};

// Get classes for message send button based on whether there's content
export const getMessageSendButtonClasses = (hasContent: boolean): string => {
  return hasContent 
    ? 'bg-blue-600 hover:bg-blue-700 text-white'
    : 'bg-gray-200 text-gray-400 cursor-not-allowed';
};

// Get progress bar style based on percentage
export const getProgressBarStyle = (percentage: number): React.CSSProperties => {
  let color = 'bg-blue-500';
  
  if (percentage < 30) color = 'bg-red-500';
  else if (percentage < 70) color = 'bg-yellow-500';
  else color = 'bg-green-500';
  
  return {
    width: `${percentage}%`,
    backgroundColor: color.split('-')[1]
  };
};

// Safely truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

// Get time difference in human readable format
export const getTimeDifference = (date: Date | string | number): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  
  if (diffSec < 60) return `${diffSec} sec ago`;
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hr ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 30) return `${diffDay} days ago`;
  
  return past.toLocaleDateString();
};