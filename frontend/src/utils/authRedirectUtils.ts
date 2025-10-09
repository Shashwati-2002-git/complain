// authRedirectUtils.ts
/**
 * Utility functions for auth-related redirections
 */

/**
 * Redirect to the appropriate dashboard based on user role
 * This function reads the user data from localStorage and redirects accordingly
 */
export const redirectToDashboard = (): void => {
  // Get user data from localStorage
  const userDataStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  if (!userDataStr || !token) {
    console.error('No user data or token found in localStorage');
    window.location.href = '/login';
    return;
  }
  
  try {
    const userData = JSON.parse(userDataStr);
    const role = userData.role || 'user';
    
    console.log(`Redirecting to dashboard with role: ${role}`);
    
    // Create or update a session flag to avoid infinite reload loops
    sessionStorage.setItem('auth_redirect', 'true');
    
    // Force reload to ensure the App component re-renders and processes the user data
    // This is needed to make sure the right dashboard component loads based on user role
    window.location.href = '/dashboard';
    
  } catch (error) {
    console.error('Error parsing user data:', error);
    window.location.href = '/login';
  }
};

/**
 * Check if the user is authenticated and should be redirected
 * Returns true if the user is authenticated
 */
export const isUserAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  
  return !!(token && userData);
};