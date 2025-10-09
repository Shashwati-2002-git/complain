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
  
  // Known authorized origins - update this list as needed
  const knownOrigins = [
    'http://localhost:5173',
    'http://localhost:5001', 
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5001',
    'http://127.0.0.1:3000'
  ];
  
  if (!knownOrigins.includes(currentOrigin)) {
    console.error(`ERROR: Current origin "${currentOrigin}" is not authorized for Google Sign-In.`);
    console.error('Please add this origin to your Google Cloud Console authorized origins:');
    console.error('1. Go to https://console.cloud.google.com/apis/credentials');
    console.error('2. Find your OAuth 2.0 Client ID');
    console.error('3. Add this origin to the "Authorized JavaScript origins" list');
    console.error(`4. Add: ${currentOrigin}`);
    return false;
  } else {
    console.log('✅ Origin appears to be correctly configured');
  }
  
  return true;
};

export default validateGoogleConfig;