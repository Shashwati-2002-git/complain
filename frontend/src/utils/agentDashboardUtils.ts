// Helper functions for the agent dashboard

/**
 * Get the color class for a complaint status
 * @param status The status of the complaint
 * @returns Tailwind CSS classes for status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'Resolved':
    case 'Closed':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'In Progress':
    case 'Under Review':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'Escalated':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'Open':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

/**
 * Get the color class for a complaint priority
 * @param priority The priority of the complaint
 * @returns Tailwind CSS classes for priority
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'High':
    case 'Urgent':
      return 'text-red-600 bg-red-50';
    case 'Medium':
      return 'text-yellow-600 bg-yellow-50';
    case 'Low':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Get classes for connection status
 * @param isConnected Whether the socket is connected
 * @returns Tailwind CSS classes for connection status indicator
 */
export function getConnectionStatusColor(isConnected: boolean): string {
  return isConnected ? 'bg-green-500' : 'bg-red-500';
}

/**
 * Get classes for button based on enabled state
 * @param enabled Whether the button is enabled
 * @param primary Whether the button is primary
 * @returns Tailwind CSS classes for button
 */
export function getButtonClasses(enabled: boolean, primary = true): string {
  if (primary) {
    return enabled 
      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
      : 'bg-gray-400 cursor-not-allowed text-white';
  } else {
    return enabled
      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
      : 'bg-gray-100 cursor-not-allowed text-gray-500';
  }
}

/**
 * Get classes for navigation item
 * @param isActive Whether the item is active
 * @returns Tailwind CSS classes for navigation item
 */
export function getNavItemClasses(isActive: boolean): string {
  return isActive 
    ? 'bg-slate-700 text-white' 
    : 'text-slate-400 hover:text-white hover:bg-slate-700';
}

/**
 * Get the styles object for progress bar width
 * @param percentage The percentage to display
 * @returns Style object with width property
 */
export function getProgressBarStyle(percentage: number): React.CSSProperties {
  return { width: `${percentage}%` };
}

/**
 * Get classes for message send button
 * @param canSend Whether the message can be sent
 * @returns Tailwind CSS classes for message send button
 */
export function getMessageSendButtonClasses(canSend: boolean): string {
  return canSend
    ? 'bg-blue-600 hover:bg-blue-700 text-white'
    : 'bg-gray-400 cursor-not-allowed text-white';
}