export type Role = 'Admin' | 'Procurement Officer' | 'Vendor' | 'Manager' | 'Approver';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: Role;
  password?: string;
  profileImage: string | null;
  createdAt: string;
  department: string;
  joiningDate: string;
  phone?: string;
  address?: string;
}

const STORAGE_KEY = 'vendorbridge_users';
const USERS_UPDATE_EVENT = 'vendorbridge_users_update';

/**
 * Retrieves all stored users. If the collection does not exist in localStorage,
 * seeds the default demo accounts exactly once.
 */
export const getUsers = (): User[] => {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached) as User[];
    } catch (e) {
      console.error('Failed to parse vendorbridge_users from localStorage', e);
    }
  }

  // Seed demo accounts only once
  const demoUsers: User[] = [
    {
      id: "1",
      employeeId: "EMP001",
      name: "Admin User",
      role: "Admin",
      email: "admin@vendorbridge.com",
      password: "admin123",
      profileImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
      department: "IT Administration",
      joiningDate: "2024-03-15",
      createdAt: "2024-03-15T00:00:00.000Z",
      phone: "+1 (555) 019-1100",
      address: "742 Evergreen Terrace, Sector 7G"
    },
    {
      id: "2",
      employeeId: "EMP002",
      name: "Procurement Officer",
      role: "Procurement Officer",
      email: "officer@vendorbridge.com",
      password: "officer123",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      department: "Procurement & Sourcing",
      joiningDate: "2025-01-10",
      createdAt: "2025-01-10T00:00:00.000Z",
      phone: "+1 (555) 019-2234",
      address: "123 Main Street, Suite 400"
    },
    {
      id: "3",
      employeeId: "EMP003",
      name: "Vendor User",
      role: "Vendor",
      email: "vendor@vendorbridge.com",
      password: "vendor123",
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      department: "External Vendor Partner",
      joiningDate: "2026-02-18",
      createdAt: "2026-02-18T00:00:00.000Z",
      phone: "+1 (555) 019-3345",
      address: "456 Commerce Parkway, Zone 3"
    },
    {
      id: "4",
      employeeId: "EMP004",
      name: "Manager User",
      role: "Manager",
      email: "manager@vendorbridge.com",
      password: "manager123",
      profileImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
      department: "Supply Chain Management",
      joiningDate: "2023-08-01",
      createdAt: "2023-08-01T00:00:00.000Z",
      phone: "+1 (555) 019-4456",
      address: "789 Executive Blvd, Floor 12"
    }
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUsers));
  return demoUsers;
};

/**
 * Creates a new user in localStorage. Prevents duplicate email registration.
 * Generates unique user ID and unique employee ID (incrementing from highest EMP number).
 */
export const createUser = (userData: Omit<User, 'id' | 'employeeId' | 'createdAt' | 'department' | 'joiningDate'>): User => {
  const users = getUsers();
  const emailLower = userData.email.toLowerCase();

  // 4. Registration must prevent duplicate emails.
  if (users.some(u => u.email.toLowerCase() === emailLower)) {
    throw new Error('Email address is already registered.');
  }

  // Generate unique employee ID (e.g. EMP005)
  const maxEmpNum = users.reduce((max, u) => {
    const num = parseInt(u.employeeId.replace('EMP', ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  const nextEmpId = `EMP${String(maxEmpNum + 1).padStart(3, '0')}`;

  // Generate unique user ID (using timestamp + random string)
  const newId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);

  // Set default fields based on role if not provided
  const department = userData.role === 'Admin'
    ? 'IT Administration'
    : userData.role === 'Procurement Officer'
    ? 'Procurement & Sourcing'
    : userData.role === 'Vendor'
    ? 'External Vendor Partner'
    : 'Supply Chain Management';

  const newDbUser: User = {
    ...userData,
    id: newId,
    employeeId: nextEmpId,
    createdAt: new Date().toISOString(),
    department,
    joiningDate: new Date().toISOString().split('T')[0],
    phone: '',
    address: ''
  };

  users.push(newDbUser);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));

  // Dispatch custom event to notify listening contexts
  window.dispatchEvent(new Event(USERS_UPDATE_EVENT));

  return newDbUser;
};

/**
 * Updates an existing user record.
 */
export const updateUser = (id: string, updates: Partial<User>): User => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    throw new Error(`User with ID ${id} not found.`);
  }

  // If email is being updated, verify it doesn't duplicate
  if (updates.email && updates.email.toLowerCase() !== users[index].email.toLowerCase()) {
    const emailLower = updates.email.toLowerCase();
    if (users.some(u => u.email.toLowerCase() === emailLower)) {
      throw new Error('Email address is already registered.');
    }
  }

  const updatedUser = { ...users[index], ...updates };
  users[index] = updatedUser;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));

  window.dispatchEvent(new Event(USERS_UPDATE_EVENT));

  return updatedUser;
};

/**
 * Deletes a user record by ID.
 */
export const deleteUser = (id: string): boolean => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    return false;
  }
  users.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));

  window.dispatchEvent(new Event(USERS_UPDATE_EVENT));

  return true;
};

/**
 * Finds a user by email address (case-insensitive).
 */
export const findUserByEmail = (email: string): User | undefined => {
  const users = getUsers();
  const emailLower = email.toLowerCase();
  return users.find(u => u.email.toLowerCase() === emailLower);
};
