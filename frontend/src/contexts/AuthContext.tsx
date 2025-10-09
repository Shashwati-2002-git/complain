import { useState, ReactNode, useEffect, useCallback } from "react";
import tokenService from "../services/tokenService";
import { AuthContext, User } from "./AuthContextTypes";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [serverSessionId, setServerSessionId] = useState<string | null>(null);

  // Tracking the last validation time to prevent excessive API calls
  const [lastValidationTime, setLastValidationTime] = useState<number>(0);
  
  // Validate session with the backend to check if token is valid and server is the same
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem("token");
      
      // No token means no session
      if (!token) {
        console.log("No token found, session invalid");
        return false;
      }
      
      // Check token validity
      if (!tokenService.validateToken(token)) {
        console.log("Token invalid or expired");
        tokenService.clearAuthData();
        setUser(null);
        return false;
      }
      
      // Throttle validate-session calls to prevent resource exhaustion
      const now = Date.now();
      const MIN_INTERVAL = 5000; // 5 seconds minimum between validation calls
      
      if (now - lastValidationTime < MIN_INTERVAL) {
        console.log("Skipping session validation - throttled to prevent resource exhaustion");
        return true; // Assume valid if we recently validated
      }
      
      // Update last validation time
      setLastValidationTime(now);

      // Validate with the server
      let response;
      let data;
      
      try {
        // Add cache-busting parameter to prevent browser caching
        const cacheBuster = `?_=${Date.now()}`;
        response = await fetch(`${API_BASE_URL}/auth/validate-session${cacheBuster}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          // Add signal to abort request after timeout
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (!response.ok) {
          console.log("Session validation failed with status:", response.status);
          
          // Only clear auth data for unauthorized errors
          // For server errors or 404s, we'll continue using the client-side validation
          if (response.status === 401 || response.status === 403) {
            tokenService.clearAuthData();
            setUser(null);
            return false;
          }
          
          // For other errors like 404 (endpoint not found), we'll assume the token is valid
          // if it passed the client-side validation earlier
          console.log("Server endpoint unavailable, falling back to client-side validation");
          return true;
        }
        
        data = await response.json();
      } catch (error) {
        // Handle network errors - continue with client-side validation
        console.warn("Network error during session validation, using client-side validation:", error);
        return true;
      }
      
      // Only process server session ID if we got valid data
      if (data) {
        // Check if server has restarted by comparing session IDs
        if (serverSessionId && data.sessionId !== serverSessionId) {
          console.log("Server has restarted, forcing re-login");
          tokenService.clearAuthData();
          setUser(null);
          return false;
        }
        
        // Store the server session ID for future comparisons
        if (data.sessionId) {
          setServerSessionId(data.sessionId);
          tokenService.setServerSessionId(data.sessionId);
        }
      }
      
      // Make sure user state is set if we have a valid token but no user object
      if (!user) {
        const storedUserStr = localStorage.getItem("user");
        if (storedUserStr) {
          try {
            const storedUser = JSON.parse(storedUserStr);
            console.log("Restoring user from localStorage during session validation:", storedUser);
            setUser(storedUser);
          } catch (err) {
            console.error("Error parsing stored user data:", err);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error("Session validation error:", error);
      return false;
    }
  }, [serverSessionId, user, lastValidationTime]);

  // Load user from localStorage and validate session
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      
      if (token && savedUser) {
        try {
          // Basic token validation before making API call
          if (!tokenService.validateToken(token)) {
            console.log("Token validation failed on load");
            tokenService.clearAuthData();
            setUser(null);
            setIsLoading(false);
            return;
          }
          
          const userData = JSON.parse(savedUser);
          setUser(userData);
          
          // Validate session with backend
          await validateSession();
        } catch (error) {
          console.error("Error during auth initialization:", error);
          tokenService.clearAuthData();
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };
    
    initializeAuth();
    
    // Set up periodic validation check (every 5 minutes)
    const intervalId = setInterval(() => {
      validateSession();
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  // Only run this effect once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAuthenticated = !!user;
  
  // Added state for OTP verification flow
  const [pendingVerification, setPendingVerification] = useState<{
    email: string;
    userId: string | null;
  } | null>(null);
  
  // Check if OTP verification is pending
  const isVerificationPending = !!pendingVerification;

  // Login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      // If the user is not verified and needs OTP verification
      if (response.status === 401 && data.requiresVerification) {
        // Set pending verification state
        setPendingVerification({
          email,
          userId: data.userId || null,
        });
        return false; // Don't proceed with login yet
      }

      if (!response.ok) return false;
      
      const userData: User = {
        id: data.user.id,
        firstName: data.user.firstName || data.user.name.split(" ")[0],
        lastName: data.user.lastName || data.user.name.split(" ").slice(1).join(" ") || "",
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  // Register
  const register = async (
    name: string,
    email: string,
    password: string,
    role: "user" | "agent" | "admin" | "analytics" = "user"
  ): Promise<boolean> => {
    try {
      console.log("Registering user with:", { name, email, role });
      
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Registration failed:", data);
        throw new Error(data.message || "Registration failed");
      }
      
      // Check if verification is required
      if (data.requiresVerification) {
        // Set the pending verification state
        setPendingVerification({
          email,
          userId: data.user?.id || null,
        });
        return false; // Return false to indicate registration is pending verification
      }
      
      const userData: User = {
        id: data.user.id,
        firstName: data.user.firstName || data.user.name.split(" ")[0],
        lastName: data.user.lastName || data.user.name.split(" ").slice(1).join(" ") || "",
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  // Google login
  const googleLogin = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) return false;
      const data = await response.json();
      const userData: User = {
        id: data.user.id,
        firstName: data.user.name.split(" ")[0],
        lastName: data.user.name.split(" ").slice(1).join(" ") || "",
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return true;
    } catch (error) {
      console.error("Google login error:", error);
      return false;
    }
  };

  // Google signup with role
  const googleSignupWithRole = async (
    token: string,
    role: "user" | "agent" | "admin" | "analytics"
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, role }),
      });

      if (!response.ok) return false;
      const data = await response.json();
      const userData: User = {
        id: data.user.id,
        firstName: data.user.name.split(" ")[0],
        lastName: data.user.name.split(" ").slice(1).join(" ") || "",
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return true;
    } catch (error) {
      console.error("Google signup error:", error);
      return false;
    }
  };

  // Decode Google token
  const decodeGoogleToken = async (token: string): Promise<{ name: string; email: string } | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google-decode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return { name: data.name, email: data.email };
    } catch (error) {
      console.error("Google token decode error:", error);
      return null;
    }
  };

  // Facebook signup with role
  const facebookSignupWithRole = async (
    code: string,
    role: "user" | "agent" | "admin" | "analytics"
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/facebook-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, role }),
      });

      if (!response.ok) return false;
      const data = await response.json();
      const userData: User = {
        id: data.user.id,
        firstName: data.user.name.split(" ")[0],
        lastName: data.user.name.split(" ").slice(1).join(" ") || "",
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return true;
    } catch (error) {
      console.error("Facebook signup error:", error);
      return false;
    }
  };

  // Facebook login
  const loginWithFacebook = async (code: string, isSignup: boolean = false): Promise<boolean> => {
    try {
      const endpoint = isSignup ? "/auth/facebook-signup" : "/auth/facebook";
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) return false;
      const data = await response.json();
      const userData: User = {
        id: data.user.id,
        firstName: data.user.name.split(" ")[0],
        lastName: data.user.name.split(" ").slice(1).join(" ") || "",
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return true;
    } catch (error) {
      console.error("Facebook login error:", error);
      return false;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };
  
  // Verify OTP for email verification
  const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) return false;
      const data = await response.json();
      
      console.log("OTP verification response:", data);

      // Ensure we have all required user data
      if (!data.user || !data.token) {
        console.error("Invalid user data or token in OTP verification response");
        return false;
      }

      const userData: User = {
        id: data.user.id,
        firstName: data.user.firstName || data.user.name.split(" ")[0],
        lastName: data.user.lastName || data.user.name.split(" ").slice(1).join(" ") || "",
        name: data.user.name,
        email: data.user.email,
        role: data.user.role || "user", // Default to user if role is missing
      };
      
      console.log("Setting user data after OTP verification:", userData);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      
      // Clear the pending verification state
      setPendingVerification(null);

      return true;
    } catch (error) {
      console.error("OTP verification error:", error);
      return false;
    }
  };

  // Resend OTP
  const resendOTP = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      return response.ok;
    } catch (error) {
      console.error("Resend OTP error:", error);
      return false;
    }
  };

  // Cancel verification flow
  const cancelVerification = () => {
    setPendingVerification(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        register,
        googleLogin,
        googleSignupWithRole,
        decodeGoogleToken,
        loginWithFacebook,
        facebookSignupWithRole,
        validateSession,
        // OTP verification related props
        pendingVerification,
        isVerificationPending,
        verifyOTP,
        resendOTP,
        cancelVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


