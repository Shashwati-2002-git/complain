import { createContext } from "react";

// User interface
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: "user" | "agent" | "admin" | "analytics";
}

// Auth context interface
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  validateSession: () => Promise<boolean>;
}

// Create Auth Context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);