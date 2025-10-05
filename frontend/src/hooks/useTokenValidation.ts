import { useState, useEffect } from 'react';
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
  // Specific additional fields that might be in the token
  permissions?: string[];
  teams?: string[];
  department?: string;
  // Index signature with more specific types
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

  // Validate and decode token
  const validateToken = (token: string | null): boolean => {
    if (!token) return false;
    
    try {
      // Basic structure validation
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Decode payload (middle part)
      const payload = JSON.parse(atob(parts[1])) as TokenPayload;
      setTokenPayload(payload);
      
      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.warn('Token has expired');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  };

  // Check token validity on mount and when dependencies change
  useEffect(() => {
    const token = localStorage.getItem('token');
    const isValid = validateToken(token);
    setIsTokenValid(isValid);
    
    if (!isValid && token) {
      // Token exists but is invalid - could try refresh or logout
      console.warn('Invalid token detected, logging out');
      localStorage.removeItem('token');
      logout();
    }
  }, [logout]);

  // Helper to refresh token
  const refreshToken = async (): Promise<boolean> => {
    try {
      // Implementation depends on your backend
      // Using the environment API URL or default
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          refreshToken: localStorage.getItem('refreshToken')
        }),
        credentials: 'include' // Include cookies if your refresh uses cookies
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Refresh token expired or invalid. User needs to login again.');
          logout();
          return false;
        }
        throw new Error(`Failed to refresh token: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Store the new tokens
      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      
      // Validate the new token
      const isValid = validateToken(data.token);
      setIsTokenValid(isValid);
      
      // Notify of token refresh
      window.dispatchEvent(new CustomEvent('tokenRefreshed', { 
        detail: { success: isValid } 
      }));
      
      return isValid;
    } catch (error) {
      console.error('Error refreshing token:', error);
      setIsTokenValid(false);
      logout();
      return false;
    }
  };

  // Check token expiration and refresh if needed
  const checkTokenExpiration = async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      const payload = JSON.parse(atob(parts[1])) as TokenPayload;
      
      // Check if token will expire soon (within 5 minutes)
      const expiresIn = payload.exp * 1000 - Date.now();
      const refreshThreshold = 5 * 60 * 1000; // 5 minutes
      
      if (expiresIn < refreshThreshold) {
        console.log('Token expiring soon, attempting refresh');
        return await refreshToken();
      }
      
      return true;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return false;
    }
  };

  return { 
    isTokenValid, 
    tokenPayload, 
    validateToken,
    refreshToken,
    checkTokenExpiration
  };
}