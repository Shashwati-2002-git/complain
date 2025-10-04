import { createContext, useContext, useState, ReactNode, useEffect } from "react";

// User interface
interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: "user" | "agent" | "admin" | "analytics";
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (
    name: string,
    email: string,
    password: string,
    role?: "user" | "agent" | "admin" | "analytics"
  ) => Promise<boolean>;
  googleLogin: (token: string) => Promise<boolean>;
  googleSignupWithRole: (
    token: string,
    role: "user" | "agent" | "admin" | "analytics"
  ) => Promise<boolean>;
  decodeGoogleToken: (token: string) => Promise<{ name: string; email: string } | null>;
  loginWithFacebook: (code: string, isSignup?: boolean) => Promise<boolean>;
  facebookSignupWithRole: (
    code: string,
    role: "user" | "agent" | "admin" | "analytics"
  ) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing saved user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

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
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
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
        login,
        logout,
        register,
        googleLogin,
        googleSignupWithRole,
        decodeGoogleToken,
        loginWithFacebook,
        facebookSignupWithRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
