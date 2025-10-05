import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Token payload interface to properly type the JWT payload
 */
interface TokenPayload {
  exp: number;
  iat: number;
  id: string;
  email: string;
  role: string;
  name?: string;
  permissions?: string[];
  teams?: string[];
  department?: string;
  [key: string]: number | string | boolean | string[] | undefined;
}

/**
 * Custom hook for token validation and management
 * Use this to validate tokens, handle refreshes, and track token status
 */
export function useTokenValidation() {
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [tokenPayload, setTokenPayload] = useState<TokenPayload | null>(null);
  const { logout } = useAuth();

  /**
   * Validate and decode JWT token
   */
  const validateToken = useCallback((token: string | null): boolean => {
    if (!token) return false;

    try {
      // Basic structure check
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token structure: not 3 parts');
        return false;
      }

      // Decode payload
      const payload = JSON.parse(atob(parts[1])) as TokenPayload;
      console.log('Token validated with payload:', JSON.stringify(payload));
      setTokenPayload(payload);

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.warn('Token has expired');
        return false;
      }

      // Check for essential fields
      if (!payload.id) {
        console.warn('Token missing id field');
        // This might still work if the backend can extract the ID from other fields
      }

      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }, []);

  /**
   * Refresh token from backend
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      console.log('Attempting to refresh token at:', apiUrl);

      // Prevent multiple simultaneous refresh attempts
      const lastRefreshTime = parseInt(localStorage.getItem('lastTokenRefresh') || '0');
      const now = Date.now();
      
      if (now - lastRefreshTime < 5000) { // 5 seconds
        console.log('Skipping token refresh - attempted too recently');
        return false;
      }
      
      // Record this attempt
      localStorage.setItem('lastTokenRefresh', now.toString());

      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          refreshToken: localStorage.getItem('refreshToken'),
        }),
        credentials: 'include', // include cookies if your refresh uses them
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Refresh token expired or invalid. Logging out...');
          logout();
          return false;
        }
        throw new Error(`Failed to refresh token: ${response.statusText}`);
      }

      const data = await response.json();

      // Save the new tokens
      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      // Validate the new token
      const isValid = validateToken(data.token);
      setIsTokenValid(isValid);

      // Notify the app that the token was refreshed
      window.dispatchEvent(
        new CustomEvent('tokenRefreshed', {
          detail: { success: isValid },
        })
      );

      console.log('Token refreshed successfully');
      return isValid;
    } catch (error) {
      console.error('Error refreshing token:', error);
      setIsTokenValid(false);
      logout();
      return false;
    }
  }, [logout, validateToken]);

  /**
   * Check if token is about to expire (within 5 minutes) and refresh if needed
   */
  const checkTokenExpiration = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found in localStorage');
      return false;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid token format - does not have three parts');
        return false;
      }

      let payload: TokenPayload;
      try {
        payload = JSON.parse(atob(parts[1])) as TokenPayload;
      } catch (e) {
        console.error('Failed to decode token payload:', e);
        return false;
      }
      
      if (!payload.exp) {
        console.error('Token missing expiration time');
        return false;
      }

      const expiresIn = payload.exp * 1000 - Date.now();
      const refreshThreshold = 5 * 60 * 1000; // 5 minutes
      
      console.log(`Token expires in ${Math.floor(expiresIn / 1000)} seconds`);

      // If token is already expired
      if (expiresIn <= 0) {
        console.log('Token already expired, attempting refresh...');
        return await refreshToken();
      }
      
      // If token is about to expire
      if (expiresIn < refreshThreshold) {
        console.log('Token expiring soon, attempting refresh...');
        return await refreshToken();
      }

      return true;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return false;
    }
  }, [refreshToken]);

  /**
   * On mount: validate token and attempt refresh if invalid
   */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const isValid = validateToken(token);
    setIsTokenValid(isValid);

    if (!isValid && token) {
      console.warn('Invalid token detected, attempting refresh...');
      refreshToken().catch((error) => {
        console.error('Token refresh failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        logout();
      });
    }
  }, [validateToken, refreshToken, logout]);

  return {
    isTokenValid,
    tokenPayload,
    validateToken,
    refreshToken,
    checkTokenExpiration,
  };
}
