import { User } from '../types';

// Mock users for development
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@company.com',
    name: 'Admin User',
    role: 'admin',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  },
  {
    id: '2',
    email: 'staff@company.com',
    name: 'Staff User',
    role: 'staff',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date(),
  },
];

const AUTH_STORAGE_KEY = 'whatsapp_marketing_auth';

export const login = async (email: string, password: string): Promise<User> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const user = MOCK_USERS.find(u => u.email === email);
  
  if (!user || password !== 'password123') {
    throw new Error('Invalid credentials');
  }
  
  // Update last login
  user.lastLogin = new Date();
  
  // Store in localStorage
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  
  return user;
};

export const logout = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getCurrentUser = async (): Promise<User | null> => {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.id !== userId) {
    throw new Error('User not found');
  }
  
  const updatedUser = { ...currentUser, ...userData };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
  
  return updatedUser;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (currentPassword !== 'password123') {
    throw new Error('Current password is incorrect');
  }
  
  // In a real app, this would update the password on the server
  console.log('Password changed successfully');
};