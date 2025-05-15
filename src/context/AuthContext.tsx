import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { UserRole, CoachTier } from '@/types/poker';
import { supabase, clearAuthState, hasCorruptedToken } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
  fullName: string;
  onlineNickname?: string;
  profilePicture?: string;
  role: UserRole;
  coachTier?: CoachTier;
  language: 'en' | 'he';
  hasAcceptedTerms?: boolean;
  lastLoginAt?: Date;
  isActive?: boolean;
  isNewUser?: boolean;
  notificationPreferences: {
    liveSessionStart: boolean;
    newFeedback: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean; // Flag to track initialization status
  forceLogin: boolean; // New flag to force login screen render
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  upgradeCoachTier: (tier: CoachTier) => void;
  cancelCoachSubscription: () => Promise<void>;
  resetAuthState: () => Promise<void>; // New method to reset auth state
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
const MAX_INITIAL_SESSION_EVENTS = 3; // Maximum number of INITIAL_SESSION events before forcing stabilization
const FORCE_STABILIZE_TIMEOUT = 3000; // Force stabilize after 3 seconds

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
    hasAcceptedTerms: false,
    isActive: true,
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [forceLogin, setForceLogin] = useState(false); // New state to force login screen
  const initialSessionCountRef = useRef(0);
  const authStabilizedRef = useRef(false);
  const lastEventTimeRef = useRef(Date.now());
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const { toast } = useToast();
  
  // Reset auth state completely and force login screen
  const resetAuthState = async () => {
    console.log("Resetting auth state completely");
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }
    
    await clearAuthState();
    setUser(null);
    setSession(null);
    setIsInitialized(true);
    setIsLoading(false);
    setForceLogin(true); // Force login screen
    
    toast({
      title: "Authentication reset",
      description: "Please log in again.",
    });
  };
  
  // Function to mark auth as stabilized
  const markAsStabilized = useCallback(() => {
    if (!isInitialized) {
      console.log("Auth is now stabilized");
      setIsInitialized(true);
      setIsLoading(false);
      authStabilizedRef.current = true;
    }
  }, [isInitialized]);

  // Force stabilization after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialized) {
        console.log("Forcing auth stabilization after timeout");
        markAsStabilized();
        
        // If we had to force stabilize, check if we need a full reset
        if (initialSessionCountRef.current > MAX_INITIAL_SESSION_EVENTS) {
          console.log("Too many initialization attempts, forcing login screen");
          setForceLogin(true);
        }
      }
    }, FORCE_STABILIZE_TIMEOUT);

    return () => clearTimeout(timer);
  }, [isInitialized, markAsStabilized]);
  
  // Debounce the fetchAndSetUser function to prevent multiple rapid calls
  const fetchAndSetUser = useCallback(async (supabaseUser: SupabaseUser) => {
    try {
      // Query the profiles table we just created
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

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
          email: data.email || supabaseUser.email || '',
          fullName: data.full_name || supabaseUser.user_metadata?.fullName || 'New User',
          onlineNickname: data.online_nickname,
          profilePicture: optimizeImageData(data.profile_picture),
          role: userRole,
          coachTier: coachTierValue,
          language: language,
          hasAcceptedTerms: Boolean(data.has_accepted_terms),
          lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
          isActive: Boolean(data.is_active),
          isNewUser: Boolean(data.is_new_user),
          notificationPreferences: notificationPrefs,
        });

        // Only update last login time when actually logged in and initialization is complete
        if (session && isInitialized) {
          updateLastLogin(supabaseUser.id);
        }
      } else {
        // If no profile exists, use data from auth user
        setUser(createUserFromSupabaseUser(supabaseUser));
      }
      
      // Mark auth as stabilized after user data is set
      markAsStabilized();
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUser(createUserFromSupabaseUser(supabaseUser));
      markAsStabilized();
    }
  }, [session, isInitialized, markAsStabilized]);

  // Helper function to update last_login_at
  const updateLastLogin = async (userId: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error("Error updating last login time:", error);
    }
  };

  // Function to safely handle auth state changes
  const handleAuthStateChange = useCallback((event: string, currentSession: Session | null) => {
    console.log("Auth state changed:", event);
    const now = Date.now();
    
    // Don't process duplicate INITIAL_SESSION events that come too quickly
    if (event === 'INITIAL_SESSION') {
      initialSessionCountRef.current += 1;
      
      // If we've seen too many INITIAL_SESSION events, force stabilization
      if (initialSessionCountRef.current > MAX_INITIAL_SESSION_EVENTS) {
        console.log(`Received ${initialSessionCountRef.current} INITIAL_SESSION events, forcing stabilization and login`);
        if (!authStabilizedRef.current) {
          markAsStabilized();
          setForceLogin(true); // Force login screen when too many initial events
          return;
        }
      }
      
      // Check for events that are too close together (potential loop)
      if (now - lastEventTimeRef.current < 200) {
        console.log("Throttling frequent auth state changes");
        return;
      }
    }
    
    lastEventTimeRef.current = now;
    
    // Set session state for all events
    setSession(currentSession);
    
    // Handle user data based on event type
    if (currentSession?.user) {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Use setTimeout to avoid blocking the auth state change event handler
        setTimeout(() => {
          fetchAndSetUser(currentSession.user);
        }, 0);
      }
    } else {
      // Clear user when signed out
      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      
      // Always stabilize auth state even when no user is present
      if (!isInitialized) {
        markAsStabilized();
      }
    }
  }, [fetchAndSetUser, isInitialized, markAsStabilized]);

  // Initialize auth and set up session listener
  useEffect(() => {
    let isActive = true; // Flag to prevent state updates after unmount
    
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        // Check for potentially corrupted tokens first
        const isCorrupted = await hasCorruptedToken();
        
        if (isCorrupted) {
          console.log("Corrupt token detected, clearing auth state");
          await clearAuthState();
        }
        
        // Set up auth state listener FIRST
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          if (isActive) {
            handleAuthStateChange(event, session);
          }
        });
        
        subscriptionRef.current = data.subscription;
        
        // Then get session explicitly - with a slight delay to avoid race conditions
        setTimeout(async () => {
          if (!isActive) return;
          
          try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            
            // Only process session if not already handled by onAuthStateChange
            if (!authStabilizedRef.current) {
              if (currentSession?.user) {
                setSession(currentSession);
                fetchAndSetUser(currentSession.user);
              } else {
                setSession(null);
                setUser(null);
                markAsStabilized();
              }
            }
          } catch (error) {
            console.error("Error getting session:", error);
            markAsStabilized();
          }
        }, 100);
      } catch (error) {
        console.error("Error in auth initialization:", error);
        markAsStabilized();
      }
    };
    
    initializeAuth();
    
    // Failsafe: set a maximum timeout to force auth to be ready
    authTimeoutRef.current = setTimeout(() => {
      if (!authStabilizedRef.current && isActive) {
        console.log("Auth failsafe timeout reached - forcing stabilization");
        markAsStabilized();
      }
    }, FORCE_STABILIZE_TIMEOUT);
    
    return () => {
      isActive = false; // Prevent state updates after unmount
      
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, [handleAuthStateChange, fetchAndSetUser, markAsStabilized]);

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

      // Reset the force login flag when successful login occurs
      setForceLogin(false);
      
      toast({
        title: "Login successful",
        description: `Welcome back!`,
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      throw error; // Re-throw the error so the Login component can handle it
    } finally {
      setIsLoading(false); // Always reset loading state regardless of outcome
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

      // Update the profiles table with new data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: optimizedUserData.fullName || user.fullName,
          online_nickname: optimizedUserData.onlineNickname || user.onlineNickname,
          profile_picture: optimizedUserData.profilePicture || user.profilePicture,
          role: optimizedUserData.role || user.role,
          coach_tier: user.role === 'coach' ? optimizedUserData.coachTier || user.coachTier : null,
          language: optimizedUserData.language || user.language,
          notification_preferences: optimizedUserData.notificationPreferences || user.notificationPreferences,
          has_accepted_terms: optimizedUserData.hasAcceptedTerms !== undefined ? optimizedUserData.hasAcceptedTerms : user.hasAcceptedTerms,
          is_active: optimizedUserData.isActive !== undefined ? optimizedUserData.isActive : user.isActive,
          is_new_user: optimizedUserData.isNewUser !== undefined ? optimizedUserData.isNewUser : user.isNewUser,
        })
        .eq('id', user.id); // Explicitly match on user ID to satisfy RLS policy

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
    isInitialized,
    forceLogin,
    login,
    signup,
    logout,
    updateUser,
    changePassword,
    upgradeCoachTier,
    cancelCoachSubscription,
    resetAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
