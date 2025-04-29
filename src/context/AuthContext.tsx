
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { UserRole, CoachTier } from '@/types/poker';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
  fullName: string;
  onlineNickname?: string;
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
  cancelCoachSubscription: () => Promise<void>;
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
  return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMmUyZTIiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPnVzZXI8L3RleHQ+PC9zdmc+';
};

// Helper function to convert Supabase User to our App User
const createUserFromSupabaseUser = (supabaseUser: SupabaseUser, role: UserRole = 'student'): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    fullName: supabaseUser.user_metadata?.fullName || 'New User',
    onlineNickname: supabaseUser.user_metadata?.onlineNickname,
    profilePicture: supabaseUser.user_metadata?.profilePicture,
    role: supabaseUser.user_metadata?.role || role,
    coachTier: supabaseUser.user_metadata?.role === 'coach' 
      ? supabaseUser.user_metadata?.coachTier || 'free' 
      : undefined,
    language: supabaseUser.user_metadata?.language || 'en',
    notificationPreferences: supabaseUser.user_metadata?.notificationPreferences || {
      liveSessionStart: true,
      newFeedback: true,
    }
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Initialize auth and set up session listener
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Only fetch user metadata after auth state change with timeout
          setTimeout(() => {
            fetchAndSetUser(currentSession.user);
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      
      if (currentSession?.user) {
        fetchAndSetUser(currentSession.user);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user data and update the state
  const fetchAndSetUser = async (supabaseUser: SupabaseUser) => {
    try {
      // Query the profiles table we just created
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        setUser(createUserFromSupabaseUser(supabaseUser));
      } else if (data) {
        // Safely cast the database values to the required types
        const userRole = data.role as UserRole;
        const language = (data.language === 'en' || data.language === 'he') ? data.language as 'en' | 'he' : 'en';
        
        let coachTierValue: CoachTier | undefined = undefined;
        if (userRole === 'coach' && data.coach_tier) {
          // Cast coach_tier to CoachTier if it's a valid value
          const validCoachTiers: CoachTier[] = ['free', 'starter', 'pro', 'elite'];
          coachTierValue = validCoachTiers.includes(data.coach_tier as CoachTier) 
            ? data.coach_tier as CoachTier 
            : 'free';
        }

        // Parse notification preferences or provide defaults
        let notificationPrefs = {
          liveSessionStart: true,
          newFeedback: true,
        };

        // Properly handle the JSON type from the database
        if (data.notification_preferences && typeof data.notification_preferences === 'object') {
          const preferences = data.notification_preferences as Record<string, any>;
          
          // Check if specific properties exist and are boolean
          if ('liveSessionStart' in preferences) {
            notificationPrefs.liveSessionStart = Boolean(preferences.liveSessionStart);
          }
          
          if ('newFeedback' in preferences) {
            notificationPrefs.newFeedback = Boolean(preferences.newFeedback);
          }
        }

        // If profile exists, use it to set user data
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          fullName: data.full_name || supabaseUser.user_metadata?.fullName || 'New User',
          onlineNickname: data.online_nickname,
          profilePicture: optimizeImageData(data.profile_picture),
          role: userRole,
          coachTier: coachTierValue,
          language: language,
          notificationPreferences: notificationPrefs,
        });
      } else {
        // If no profile exists, use data from auth user
        setUser(createUserFromSupabaseUser(supabaseUser));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUser(createUserFromSupabaseUser(supabaseUser));
    } finally {
      setIsLoading(false);
    }
  };

  // Authentication methods
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Login successful",
        description: `Welcome back!`,
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "An unexpected error occurred",
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            fullName,
            role,
            coachTier: role === 'coach' ? 'free' : undefined,
            language: 'en',
            notificationPreferences: {
              liveSessionStart: true,
              newFeedback: true,
            },
          },
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Sign up successful",
        description: `Welcome, ${fullName}!`,
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    
    try {
      // If updating profile picture, optimize it first
      let optimizedUserData = { ...userData };
      if (userData.profilePicture) {
        optimizedUserData.profilePicture = optimizeImageData(userData.profilePicture);
      }
      
      // Update user metadata in Supabase auth
      const { error: authError } = await supabase.auth.updateUser({
        data: optimizedUserData,
      });

      if (authError) {
        throw authError;
      }

      // Also update the profile in the profiles table if it exists
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: optimizedUserData.fullName || user.fullName,
          online_nickname: optimizedUserData.onlineNickname || user.onlineNickname,
          profile_picture: optimizedUserData.profilePicture || user.profilePicture,
          role: optimizedUserData.role || user.role,
          coach_tier: user.role === 'coach' ? optimizedUserData.coachTier || user.coachTier : null,
          language: optimizedUserData.language || user.language,
          notification_preferences: optimizedUserData.notificationPreferences || user.notificationPreferences,
        });

      if (profileError) {
        throw profileError;
      }
      
      const updatedUser = { ...user, ...optimizedUserData };
      setUser(updatedUser);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
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
      // In Supabase v2, to change password we need to:
      // 1. Sign in with the current password to verify
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      
      if (signInError) {
        throw new Error('Current password is incorrect');
      }
      
      // 2. Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (updateError) {
        throw updateError;
      }
      
      toast({
        title: "Password changed",
        description: "Your password has been successfully updated",
      });
    } catch (error: any) {
      toast({
        title: "Password change failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to upgrade coach tier
  const upgradeCoachTier = async (tier: CoachTier) => {
    if (!user || user.role !== 'coach') {
      toast({
        title: "Upgrade failed",
        description: "Only coaches can upgrade their tier",
        variant: "destructive",
      });
      return;
    }

    await updateUser({ coachTier: tier });

    toast({
      title: "Tier upgraded",
      description: `Your account has been upgraded to ${tier} tier!`,
    });
  };

  // Function to cancel coach subscription
  const cancelCoachSubscription = async (): Promise<void> => {
    if (!user || user.role !== 'coach') {
      toast({
        title: "Cancellation failed",
        description: "Only coaches with active subscriptions can cancel",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Set coach tier back to free
      await updateUser({ coachTier: 'free' });
      
      // Return success
      toast({
        title: "Subscription canceled",
        description: "Your subscription has been successfully canceled",
      });
      return;
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      throw new Error(error.message || "Failed to cancel subscription");
    }
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
    cancelCoachSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
