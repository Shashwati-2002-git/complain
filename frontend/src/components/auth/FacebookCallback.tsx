import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const FacebookCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithFacebook } = useAuth();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setError('Facebook authentication was cancelled or failed');
          setLoading(false);
          return;
        }

        if (!code) {
          setError('No authorization code received from Facebook');
          setLoading(false);
          return;
        }

        // Determine if this is a signup or login based on state
        const isSignup = state === 'signup';
        
        const success = await loginWithFacebook(code, isSignup);
        
        if (success) {
          navigate('/dashboard');
        } else {
          setError('Facebook authentication failed. Please try again.');
        }
      } catch (error) {
        console.error('Facebook callback error:', error);
        setError('An error occurred during Facebook authentication');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, loginWithFacebook]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing Facebook authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Authentication Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default FacebookCallback;