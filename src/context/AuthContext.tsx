
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

const MAX_PROFILE_IMAGE_SIZE = 50 * 1024; // 50KB limit for profile images

// Function to optimize image data to prevent storage quota issues
const optimizeImageData = (imageDataUrl: string | undefined): string | undefined => {
  if (!imageDataUrl) return undefined;
  
  // If it's already small enough, just return it
  if (imageDataUrl.length <= MAX_PROFILE_IMAGE_SIZE) {
    return imageDataUrl;
  }
  
  // For large profile images, return a placeholder instead
  // In a real app, you might want to use a service like Cloudinary or S3 for image storage
  return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMmUyZTIiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPnVzZXI8L3RleHQ+PC9zdmc+';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      // Check for existing user in localStorage
      const storedUser = localStorage.getItem('sessionMasterUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading user from localStorage:", error);
      // If there's an error loading, don't crash the app
      localStorage.removeItem('sessionMasterUser');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save user data to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      try {
        // Optimize profile picture before saving to reduce storage size
        const optimizedUser = {
          ...user,
          profilePicture: optimizeImageData(user.profilePicture)
        };
        
        localStorage.setItem('sessionMasterUser', JSON.stringify(optimizedUser));
      } catch (error) {
        console.error("Failed to save user to localStorage:", error);
        toast({
          title: "Storage Error",
          description: "Unable to save user data. Some settings might not persist.",
          variant: "destructive"
        });
      }
    }
  }, [user, toast]);

  // Mock authentication functions
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get all users from localStorage
      let users;
      try {
        const usersData = localStorage.getItem('sessionMasterUsers') || '[]';
        users = JSON.parse(usersData);
      } catch (error) {
        console.error("Error parsing users from localStorage:", error);
        users = [];
      }
      
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
      
      // Optimize profile picture to prevent storage issues
      const optimizedUser = {
        ...userWithoutPassword,
        profilePicture: optimizeImageData(userWithoutPassword.profilePicture)
      };
      
      setUser(optimizedUser);
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
      let users;
      try {
        const usersData = localStorage.getItem('sessionMasterUsers') || '[]';
        users = JSON.parse(usersData);
      } catch (error) {
        console.error("Error parsing users from localStorage:", error);
        users = [];
      }
      
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
      
      try {
        localStorage.setItem('sessionMasterUsers', JSON.stringify(users));
      } catch (error) {
        console.error("Failed to save users to localStorage:", error);
        toast({
          title: "Storage Error",
          description: "Unable to complete signup due to browser storage limitations.",
          variant: "destructive",
        });
        throw new Error("Registration failed due to storage limitations");
      }
      
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
    
    try {
      // If updating profile picture, optimize it first
      let optimizedUserData = { ...userData };
      if (userData.profilePicture) {
        optimizedUserData.profilePicture = optimizeImageData(userData.profilePicture);
      }
      
      const updatedUser = { ...user, ...optimizedUserData };
      setUser(updatedUser);
      
      // Also update the user in the users array
      const usersData = localStorage.getItem('sessionMasterUsers');
      if (usersData) {
        const users = JSON.parse(usersData);
        const updatedUsers = users.map((u: any) => 
          u.id === user.id ? { ...u, ...optimizedUserData } : u
        );
        
        try {
          localStorage.setItem('sessionMasterUsers', JSON.stringify(updatedUsers));
        } catch (error) {
          console.error("Failed to update user in localStorage:", error);
          toast({
            title: "Storage Issue",
            description: "Profile updated, but changes may not persist after logout.",
            variant: "warning",
          });
          return;
        }
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
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
      const usersData = localStorage.getItem('sessionMasterUsers');
      if (!usersData) {
        throw new Error('User data not found');
      }
      
      const users = JSON.parse(usersData);
      
      // Find current user
      const currentUser = users.find((u: any) => u.id === user.id);
      
      // Check if current password matches
      if (!currentUser || currentUser.password !== currentPassword) {
        throw new Error('Current password is incorrect');
      }
      
      // Update password
      currentUser.password = newPassword;
      
      // Save updated users array to localStorage
      try {
        localStorage.setItem('sessionMasterUsers', JSON.stringify(users));
      } catch (error) {
        throw new Error('Failed to save password due to storage limitations');
      }
      
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

  // Function to upgrade coach tier
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
