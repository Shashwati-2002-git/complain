// This file helps debug Google Sign-In issues
console.log('==== Google Sign-In Debug Information ====');
console.log('Current origin:', window.location.origin);
console.log('Google Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log('================================');

// Export a function to validate Google Sign-In configuration
export const validateGoogleConfig = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const currentOrigin = window.location.origin;
  
  console.log('Validating Google Sign-In configuration:');
  console.log('- Client ID exists:', !!clientId);
  console.log('- Client ID length:', clientId?.length || 0);
  console.log('- Current origin:', currentOrigin);
  
  // Common issues to check
  if (!clientId) {
    console.error('ERROR: Google Client ID is missing. Check your .env file.');
    return false;
  }
  
  if (currentOrigin !== 'http://localhost:5173' && 
      currentOrigin !== 'http://localhost:5001' && 
      currentOrigin !== 'http://localhost:3000') {
    console.warn('WARNING: You might need to add this origin to your Google Cloud Console authorized origins:', currentOrigin);
  }
  
  return true;
};

export default validateGoogleConfig;