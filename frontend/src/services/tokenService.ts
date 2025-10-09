import { jwtDecode } from 'jwt-decode';

// Define token payload interface
interface TokenPayload {
  id: string;
  exp: number;
  iat: number;
  email?: string;
  role?: string;
}

// Session key to track server uniqueness
const SERVER_SESSION_KEY = 'server_session_id';

/**
 * Token validation service to centralize all token validation logic
 */
class TokenService {
  /**
   * Validate if a token exists, is well-formed, and not expired
   */
  validateToken(token: string | null): boolean {
    if (!token) return false;

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      
      // Check if token is expired
      const currentTime = Date.now() / 1000;
      if (decoded.exp && decoded.exp < currentTime) {
        console.log('Token expired');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Invalid token format:', error);
      return false;
    }
  }

  /**
   * Get user data from token
   */
  getTokenData(token: string | null): TokenPayload | null {
    if (!token) return null;

    try {
      return jwtDecode<TokenPayload>(token);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Store server session ID in localStorage to detect server restarts
   */
  setServerSessionId(sessionId: string): void {
    localStorage.setItem(SERVER_SESSION_KEY, sessionId);
  }

  /**
   * Check if server session has changed (server restarted)
   */
  hasServerSessionChanged(currentSessionId: string): boolean {
    const storedSessionId = localStorage.getItem(SERVER_SESSION_KEY);
    return storedSessionId !== currentSessionId && storedSessionId !== null;
  }

  /**
   * Clear all authentication data
   */
  clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
  }
}

// Create a singleton instance
const tokenService = new TokenService();
export default tokenService;