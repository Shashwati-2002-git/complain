import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: "user" | "agent" | "admin";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (
    name: string,
    email: string,
    password: string,
    role?: "user" | "agent" | "admin"
  ) => Promise<boolean>;
  googleLogin: (token: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = "http://localhost:5000/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage if already logged in
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
      console.error("Login error:", error);
      return false;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: "user" | "agent" | "admin" = "user"
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
      console.error("Registration error:", error);
      return false;
    }
  };

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

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        googleLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
