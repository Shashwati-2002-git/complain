import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: 'user' | 'agent' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string, role?: 'user' | 'agent' | 'admin') => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:5000/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Check for existing token on page load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const userData = {
          id: data.user.id,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          name: `${data.user.firstName} ${data.user.lastName}`,
          email: data.user.email,
          role: data.user.role,
        };
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return true;
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      // Fallback to mock authentication for demo
      return mockLogin(email, password);
    }
  };

  // Fallback mock authentication for demo purposes
  const mockLogin = (email: string, password: string): boolean => {
    const mockUsers = [
      { id: '1', firstName: 'John', lastName: 'Doe', email: 'user@example.com', password: 'password', role: 'user' as const },
      { id: '2', firstName: 'Admin', lastName: 'User', email: 'admin@example.com', password: 'admin', role: 'admin' as const },
      { id: '3', firstName: 'Agent', lastName: 'Smith', email: 'agent@example.com', password: 'agent', role: 'agent' as const },
      // Add polu as admin for testing
      { id: '4', firstName: 'Polu', lastName: 'Admin', email: 'polu@example.com', password: 'polu', role: 'admin' as const },
      { id: '5', firstName: 'Polu', lastName: 'User', email: 'polu', password: 'polu', role: 'admin' as const },
    ];

    const foundUser = mockUsers.find(u => 
      (u.email === email || u.firstName.toLowerCase() === email.toLowerCase()) && 
      u.password === password
    );
    
    if (foundUser) {
      const userData = {
        id: foundUser.id,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        name: `${foundUser.firstName} ${foundUser.lastName}`,
        email: foundUser.email,
        role: foundUser.role,
      };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      console.log('Mock login successful for user:', userData); // Debug log
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const register = async (name: string, email: string, password: string, role: 'user' | 'agent' | 'admin' = 'user'): Promise<boolean> => {
    try {
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          firstName,
          lastName, 
          email, 
          password,
          role: role 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const userData = {
          id: data.user.id,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          name: `${data.user.firstName} ${data.user.lastName}`,
          email: data.user.email,
          role: data.user.role,
        };
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return true;
      } else {
        console.error('Registration failed');
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Fallback to mock registration for demo
      const userData = {
        id: Date.now().toString(),
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        name,
        email,
        role: role,
      };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return true;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      register,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}