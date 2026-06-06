import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getUsers, findUserByEmail, type User } from '../db/users';

export type Role = 'Admin' | 'Procurement Officer' | 'Vendor' | 'Manager' | 'Approver';

export interface UserProfile {
  id: string;
  employeeId: string;
  name: string;
  role: Role;
  email: string;
  profileImage: string | null;
  department: string;
  joiningDate: string;
  phone?: string;
  address?: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  profiles: UserProfile[];
  passwords: Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'vendor_bridge_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => getUsers());

  useEffect(() => {
    const handleUpdate = () => {
      setUsers(getUsers());
    };
    window.addEventListener('vendorbridge_users_update', handleUpdate);
    return () => {
      window.removeEventListener('vendorbridge_users_update', handleUpdate);
    };
  }, []);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem(AUTH_STORAGE_KEY);
    return cached ? JSON.parse(cached) as UserProfile : null;
  });

  const isAuthenticated = currentUser !== null;

  const login = (email: string, password: string): boolean => {
    const matchedUser = findUserByEmail(email);
    if (matchedUser && matchedUser.password === password) {
      const { password: _, ...profile } = matchedUser;
      setCurrentUser(profile as UserProfile);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const profiles: UserProfile[] = users.map(({ password: _, ...p }) => p as UserProfile);

  const passwords: Record<string, string> = users.reduce((acc, u) => {
    if (u.password) {
      acc[u.email.toLowerCase()] = u.password;
    }
    return acc;
  }, {} as Record<string, string>);

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, login, logout, profiles, passwords }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
