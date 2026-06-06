import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getUsers, createUser, updateUser, findUserByEmail, type User } from '../db/users';

export type Role = 'Admin' | 'Procurement Officer' | 'Vendor' | 'Manager';

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

export interface RoleTheme {
  primary: string;
  text: string;
  glow: string;
  badgeClass: string;
  gradient: string;
}

interface RoleContextType {
  currentRole: Role;
  user: UserProfile; // Non-nullable for type-safety across page modules
  theme: RoleTheme;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => boolean;
  logout: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  register: (name: string, email: string, role: Role, password: string, profileImage?: string | null) => boolean;
  profiles: UserProfile[];
  passwords: Record<string, string>;
  setProfiles: React.Dispatch<React.SetStateAction<UserProfile[]>>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const roleThemes: Record<Role, RoleTheme> = {
  Admin: {
    primary: '#a855f7', // Purple
    text: '#c084fc',
    glow: 'glass-card-glow-purple',
    badgeClass: 'badge-admin',
    gradient: 'from-purple-500/20 to-violet-500/5',
  },
  'Procurement Officer': {
    primary: '#3b82f6', // Blue
    text: '#60a5fa',
    glow: 'glass-card-glow-blue',
    badgeClass: 'badge-procurement',
    gradient: 'from-blue-500/20 to-indigo-500/5',
  },
  Vendor: {
    primary: '#06b6d4', // Cyan
    text: '#22d3ee',
    glow: 'glass-card-glow-cyan',
    badgeClass: 'badge-vendor',
    gradient: 'from-cyan-500/20 to-teal-500/5',
  },
  Manager: {
    primary: '#10b981', // Emerald
    text: '#34d399',
    glow: 'glass-card-glow-emerald',
    badgeClass: 'badge-manager',
    gradient: 'from-emerald-500/20 to-teal-500/5',
  },
};

const AUTH_STORAGE_KEY = 'vendorbridge_current_user';

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
    const localCached = localStorage.getItem(AUTH_STORAGE_KEY);
    if (localCached) return JSON.parse(localCached);
    const sessionCached = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return sessionCached ? JSON.parse(sessionCached) : null;
  });

  const isAuthenticated = currentUser !== null;
  const currentRole: Role = currentUser ? (currentUser.role as Role) : 'Admin';

  const login = (email: string, password: string, rememberMe: boolean = true): boolean => {
    const matchedUser = findUserByEmail(email);
    if (matchedUser && matchedUser.password === password) {
      const { password: _, ...profile } = matchedUser;
      setCurrentUser(profile as UserProfile);
      if (rememberMe) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    
    if (localStorage.getItem(AUTH_STORAGE_KEY)) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    } else if (sessionStorage.getItem(AUTH_STORAGE_KEY)) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    }

    // Also update in localStorage vendorbridge_users
    updateUser(currentUser.id, updates as Partial<User>);
  };

  const register = (name: string, email: string, role: Role, passwordVal: string, profileImage?: string | null): boolean => {
    try {
      createUser({
        name,
        email,
        role: role as any,
        password: passwordVal,
        profileImage: profileImage || null,
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const profiles: UserProfile[] = users
    .filter(u => u.role !== 'Approver') // filter out approver if not in Role context
    .map(({ password: _, ...p }) => p as UserProfile);

  const passwords: Record<string, string> = users.reduce((acc, u) => {
    if (u.password) {
      acc[u.email.toLowerCase()] = u.password;
    }
    return acc;
  }, {} as Record<string, string>);

  const setProfiles: React.Dispatch<React.SetStateAction<UserProfile[]>> = (
    value: React.SetStateAction<UserProfile[]>
  ) => {
    const updated = typeof value === 'function' ? value(profiles) : value;
    const updatedUsers = users.map(u => {
      const match = updated.find(p => p.id === u.id);
      return match ? { ...u, ...match } : u;
    });
    localStorage.setItem('vendorbridge_users', JSON.stringify(updatedUsers));
    window.dispatchEvent(new Event('vendorbridge_users_update'));
  };

  const theme = roleThemes[currentRole];

  // Fallback seeder profile for unauthenticated context initialization
  const user = currentUser || profiles[0];

  return (
    <RoleContext.Provider value={{ currentRole, user, theme, isAuthenticated, login, logout, updateUserProfile, register, profiles, passwords, setProfiles }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
