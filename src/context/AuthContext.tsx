import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { demoUsers, demoPasswords } from './RoleContext';
export type Role = 'Admin' | 'Procurement Officer' | 'Vendor' | 'Manager' | 'Approver';

export interface UserProfile {
  id: string;
  employeeId: string;
  name: string;
  role: Role;
  email: string;
  profileImage: string;
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
  // Load or initialize demo profiles and passwords
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    const cached = localStorage.getItem('vendor_bridge_user_profiles');
    if (cached) {
      try {
        return JSON.parse(cached) as UserProfile[];
      } catch (e) {
        console.error(e);
      }
    }
    // Fallback to demo users defined in RoleContext
    const demo = demoUsers;
    localStorage.setItem('vendor_bridge_user_profiles', JSON.stringify(demo));
    return demo;
  });

  const [passwords, setPasswords] = useState<Record<string, string>>(() => {
    const cached = localStorage.getItem('vendor_bridge_user_passwords');
    if (cached) {
      try {
        return JSON.parse(cached) as Record<string, string>;
      } catch (e) {
        console.error(e);
      }
    }
    // Use demo passwords from RoleContext
    const demoPass = demoPasswords;
    localStorage.setItem('vendor_bridge_user_passwords', JSON.stringify(demoPass));
    return demoPass;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem(AUTH_STORAGE_KEY);
    return cached ? JSON.parse(cached) as UserProfile : null;
  });

  const isAuthenticated = currentUser !== null;

  const login = (email: string, password: string): boolean => {
    const matchedUser = profiles.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (matchedUser && passwords[matchedUser.email.toLowerCase()] === password) {
      setCurrentUser(matchedUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matchedUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // Sync profiles and passwords to localStorage when they change
  React.useEffect(() => {
    if (profiles.length) {
      localStorage.setItem('vendor_bridge_user_profiles', JSON.stringify(profiles));
    }
  }, [profiles]);

  React.useEffect(() => {
    if (Object.keys(passwords).length) {
      localStorage.setItem('vendor_bridge_user_passwords', JSON.stringify(passwords));
    }
  }, [passwords]);

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
