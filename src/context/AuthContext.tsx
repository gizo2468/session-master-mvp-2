import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { UserRole, CoachTier } from '@/types/poker';

export interface User {
  id: string;
  email: string;
  fullName: string;
  profilePicture?: string;
  role: UserRole;
  coachTier?: CoachTier;
  language: 'en' | 'he';
  notificationPreferences: {
    liveSessionStart: boolean;
    newFeedback: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  upgradeCoachTier: (tier: CoachTier) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing user in localStorage
    const storedUser = localStorage.getItem('sessionMasterUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Save user data to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('sessionMasterUser', JSON.stringify(user));
    }
  }, [user]);

  // Mock authentication functions
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get all users from localStorage
      const users = JSON.parse(localStorage.getItem('sessionMasterUsers') || '[]');
      
      // Find user with matching email
      const foundUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      
      // Check if user exists and password matches
      if (!foundUser) {
        throw new Error('User not found');
      }
      
      if (foundUser.password !== password) {
        throw new Error('Invalid password');
      }
      
      // Remove password from user object before storing in state
      const { password: _, ...userWithoutPassword } = foundUser;
      
      setUser(userWithoutPassword);
      toast({
        title: "Login successful",
        description: `Welcome back, ${foundUser.fullName}!`,
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, fullName: string, role: UserRole) => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get all users from localStorage
      const users = JSON.parse(localStorage.getItem('sessionMasterUsers') || '[]');
      
      // Check if user with this email already exists
      if (users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('User with this email already exists');
      }
      
      // Create new user object with role
      const newUser: User & { password: string } = {
        id: uuidv4(),
        email,
        password, // In a real app, this would be hashed
        fullName,
        role,
        coachTier: role === 'coach' ? 'free' : undefined,
        language: 'en', // Default language is English
        notificationPreferences: {
          liveSessionStart: true,
          newFeedback: true,
        },
      };
      
      // Add new user to users array
      users.push(newUser);
      localStorage.setItem('sessionMasterUsers', JSON.stringify(users));
      
      // Remove password from user object before storing in state
      const { password: _, ...userWithoutPassword } = newUser;
      
      setUser(userWithoutPassword);
      toast({
        title: "Sign up successful",
        description: `Welcome, ${fullName}!`,
      });
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('sessionMasterUser');
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    
    // Also update the user in the users array
    const users = JSON.parse(localStorage.getItem('sessionMasterUsers') || '[]');
    const updatedUsers = users.map((u: any) => 
      u.id === user.id ? { ...u, ...userData } : u
    );
    localStorage.setItem('sessionMasterUsers', JSON.stringify(updatedUsers));
    
    toast({
      title: "Profile updated",
      description: "Your profile has been successfully updated",
    });
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) {
      throw new Error('No user logged in');
    }
    
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get all users from localStorage
      const users = JSON.parse(localStorage.getItem('sessionMasterUsers') || '[]');
      
      // Find current user
      const currentUser = users.find((u: any) => u.id === user.id);
      
      // Check if current password matches
      if (!currentUser || currentUser.password !== currentPassword) {
        throw new Error('Current password is incorrect');
      }
      
      // Update password
      currentUser.password = newPassword;
      
      // Save updated users array to localStorage
      localStorage.setItem('sessionMasterUsers', JSON.stringify(users));
      
      toast({
        title: "Password changed",
        description: "Your password has been successfully updated",
      });
    } catch (error) {
      toast({
        title: "Password change failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // New function to upgrade coach tier
  const upgradeCoachTier = (tier: CoachTier) => {
    if (!user || user.role !== 'coach') {
      toast({
        title: "Upgrade failed",
        description: "Only coaches can upgrade their tier",
        variant: "destructive",
      });
      return;
    }

    updateUser({ coachTier: tier });

    toast({
      title: "Tier upgraded",
      description: `Your account has been upgraded to ${tier} tier!`,
    });
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    updateUser,
    changePassword,
    upgradeCoachTier,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
