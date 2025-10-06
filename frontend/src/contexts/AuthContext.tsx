import { useState, ReactNode, useEffect, useCallback } from "react";
import tokenService from "../services/tokenService";
import { AuthContext, User } from "./AuthContextTypes";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [serverSessionId, setServerSessionId] = useState<string | null>(null);

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

      // Validate with the server
      const response = await fetch(`${API_BASE_URL}/auth/validate-session`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.log("Session validation failed with status:", response.status);
        tokenService.clearAuthData();
        setUser(null);
        return false;
      }

      const data = await response.json();
      
      // Check if server has restarted by comparing session IDs
      if (serverSessionId && data.sessionId !== serverSessionId) {
        console.log("Server has restarted, forcing re-login");
        tokenService.clearAuthData();
        setUser(null);
        return false;
      }
      
      // Store the server session ID for future comparisons
      setServerSessionId(data.sessionId);
      tokenService.setServerSessionId(data.sessionId);
      
      return true;
    } catch (error) {
      console.error("Session validation error:", error);
      return false;
    }
  }, [serverSessionId]);

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
  }, [validateSession]);

  const isAuthenticated = !!user;

  // Login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) return false;
      const data = await response.json();
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


