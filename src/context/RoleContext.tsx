import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type Role = 'Admin' | 'Procurement Officer' | 'Vendor' | 'Manager';

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
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  register: (name: string, email: string, role: Role, password: string) => boolean;
  profiles: UserProfile[];
  passwords: Record<string, string>;
  setProfiles: React.Dispatch<React.SetStateAction<UserProfile[]>>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const demoUsers: UserProfile[] = [
  {
    id: "1",
    employeeId: "EMP001",
    name: "Admin User",
    role: "Admin",
    email: "admin@vendorbridge.com",
    profileImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
    department: "IT Administration",
    joiningDate: "2024-03-15",
    phone: "+1 (555) 019-1100",
    address: "742 Evergreen Terrace, Sector 7G"
  },
  {
    id: "2",
    employeeId: "EMP002",
    name: "Procurement Officer",
    role: "Procurement Officer",
    email: "officer@vendorbridge.com",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    department: "Procurement & Sourcing",
    joiningDate: "2025-01-10",
    phone: "+1 (555) 019-2234",
    address: "123 Main Street, Suite 400"
  },
  {
    id: "3",
    employeeId: "EMP003",
    name: "Vendor User",
    role: "Vendor",
    email: "vendor@vendorbridge.com",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    department: "External Vendor Partner",
    joiningDate: "2026-02-18",
    phone: "+1 (555) 019-3345",
    address: "456 Commerce Parkway, Zone 3"
  },
  {
    id: "4",
    employeeId: "EMP004",
    name: "Manager User",
    role: "Manager",
    email: "manager@vendorbridge.com",
    profileImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
    department: "Supply Chain Management",
    joiningDate: "2023-08-01",
    phone: "+1 (555) 019-4456",
    address: "789 Executive Blvd, Floor 12"
  }
];

const demoPasswords: Record<string, string> = {
  'admin@vendorbridge.com': 'admin123',
  'officer@vendorbridge.com': 'officer123',
  'vendor@vendorbridge.com': 'vendor123',
  'manager@vendorbridge.com': 'manager123'
};

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

const AUTH_STORAGE_KEY = 'vendor_bridge_auth_user';

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    const cached = localStorage.getItem('vendor_bridge_user_profiles');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.setItem('vendor_bridge_user_profiles', JSON.stringify(demoUsers));
    return demoUsers;
  });

  const [passwords, setPasswords] = useState<Record<string, string>>(() => {
    const cached = localStorage.getItem('vendor_bridge_user_passwords');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.setItem('vendor_bridge_user_passwords', JSON.stringify(demoPasswords));
    return demoPasswords;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem(AUTH_STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  });

  const isAuthenticated = currentUser !== null;
  const currentRole: Role = currentUser ? currentUser.role : 'Admin';



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

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));

    const updatedProfiles = profiles.map(p => p.id === currentUser.id ? updatedUser : p);
    setProfiles(updatedProfiles);
    localStorage.setItem('vendor_bridge_user_profiles', JSON.stringify(updatedProfiles));
  };

  const register = (name: string, email: string, role: Role, passwordVal: string): boolean => {
    const emailLower = email.toLowerCase();
    if (profiles.some(p => p.email.toLowerCase() === emailLower)) {
      return false; // User already exists
    }

    const avatar = role === 'Admin' 
      ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face"
      : role === 'Procurement Officer'
      ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
      : role === 'Vendor'
      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
      : "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face";

    const maxEmpNum = profiles.reduce((max, p) => {
      const num = parseInt(p.employeeId.replace('EMP', ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const nextEmpId = `EMP${String(maxEmpNum + 1).padStart(3, '0')}`;

    const newProfile: UserProfile = {
      id: String(profiles.length + 1),
      employeeId: nextEmpId,
      name,
      role,
      email: emailLower,
      profileImage: avatar,
      department: role === 'Admin' 
        ? 'IT Administration' 
        : role === 'Procurement Officer' 
        ? 'Procurement & Sourcing' 
        : role === 'Vendor' 
        ? 'External Vendor Partner' 
        : 'Supply Chain Management',
      joiningDate: new Date().toISOString().split('T')[0],
      phone: '',
      address: ''
    };

    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    localStorage.setItem('vendor_bridge_user_profiles', JSON.stringify(updatedProfiles));

    const updatedPasswords = { ...passwords, [emailLower]: passwordVal };
    setPasswords(updatedPasswords);
    localStorage.setItem('vendor_bridge_user_passwords', JSON.stringify(updatedPasswords));

    return true;
  };

  const theme = roleThemes[currentRole];

  // Fallback seeder profile for unauthenticated context initialization
  const user = currentUser || profiles[0];

  return (
    <RoleContext.Provider value={{ currentRole, user, theme, isAuthenticated, login, logout, updateUserProfile, register, profiles, passwords }}>
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
