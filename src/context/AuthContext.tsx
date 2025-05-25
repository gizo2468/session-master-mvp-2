
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  hasAcceptedTerms?: boolean;
  lastLoginAt?: Date;
  isActive?: boolean;
  notificationPreferences: {
    liveSessionStart: boolean;
    newFeedback: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionId: string | null;
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
    hasAcceptedTerms: false,
    isActive: true,
    notificationPreferences: supabaseUser.user_metadata?.notificationPreferences || {
      liveSessionStart: true,
      newFeedback: true,
    }
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();

  // State for coach - start with empty arrays for new users
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track auth state initialization
  const [authChecked, setAuthChecked] = useState(false);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  
  // Track true login events vs. session restores
  const isFreshLogin = useRef(false);
  const lastToastTime = useRef<number>(0);
  const sessionInitCount = useRef(0);
  
  // Prevent multiple toast notifications within a short timeframe
  const showWelcomeToast = (userName: string) => {
    const now = Date.now();
    // Only show a welcome toast if:
    // 1. It's a fresh login (not a session restore) OR
    // 2. It's been at least 10 seconds since the last toast
    if (isFreshLogin.current || (now - lastToastTime.current > 10000)) {
      toast({
        title: "Login successful",
        description: `Welcome back, ${userName}!`,
      });
      lastToastTime.current = now;
      isFreshLogin.current = false; // Reset the fresh login flag
    }
  };

  // Initialize auth and set up session listener
  useEffect(() => {
    console.log("Auth provider initializing...");
    let isActive = true;
    sessionInitCount.current += 1;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isActive) return;
        
        console.log("Auth state change:", event, "Session exists:", Boolean(currentSession), 
                   "Session ID:", currentSession?.access_token?.substring(0, 8));
        
        if (currentSession?.access_token !== session?.access_token) {
          console.log("Session token changed");
          setSession(currentSession);
          setSessionId(currentSession?.access_token?.substring(0, 8) || null);
        }
        
        if (event === 'SIGNED_IN') {
          isFreshLogin.current = true;
          if (currentSession?.user) {
            console.log("New user signed in:", currentSession.user.id, 
                       "Metadata role:", currentSession.user.user_metadata?.role);
            // Only fetch user metadata after auth state change with timeout to prevent deadlocks
            setTimeout(() => {
              if (isActive) {
                fetchAndSetUser(currentSession.user);
              }
            }, 0);
          }
        } else if (event === 'TOKEN_REFRESHED') {
          console.log("Token refreshed - updating session only");
          // Don't mark as fresh login for token refresh - this is just session maintenance
          if (currentSession?.user) {
            // Ensure we have latest user data with the refreshed token
            setTimeout(() => {
              if (isActive) {
                fetchAndSetUser(currentSession.user, false);
              }
            }, 0);
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear user data on sign out
          console.log("User signed out - clearing state");
          setUser(null);
          setSessionId(null);
        }
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        console.log("Checking for existing session...");
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setIsLoading(false);
          setAuthChecked(true);
          setInitialCheckComplete(true);
          return;
        }

        console.log("Initial session check:", 
                    "Session exists:", Boolean(currentSession),
                    "Session ID:", currentSession?.access_token?.substring(0, 8));
        
        setSession(currentSession);
        setSessionId(currentSession?.access_token?.substring(0, 8) || null);
        
        if (currentSession?.user) {
          console.log("Existing session found for user:", currentSession.user.id,
                     "Metadata role:", currentSession.user.user_metadata?.role);
          await fetchAndSetUser(currentSession.user, false); // false = not a fresh login
        } else {
          setIsLoading(false);
          setAuthChecked(true);
          setInitialCheckComplete(true);
        }
      } catch (error) {
        console.error("Error during auth initialization:", error);
        setIsLoading(false);
        setAuthChecked(true);
        setInitialCheckComplete(true);
      }
    };

    initializeAuth();

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user data and update the state
  const fetchAndSetUser = async (supabaseUser: SupabaseUser, isNewLogin: boolean = true) => {
    try {
      console.log("Fetching user data for ID:", supabaseUser.id, 
                  "Is new login:", isNewLogin,
                  "User metadata role:", supabaseUser.user_metadata?.role);
      
      // Query the profiles table we just created
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        const defaultUser = createUserFromSupabaseUser(supabaseUser);
        console.log("Created default user with role:", defaultUser.role);
        setUser(defaultUser);
        
        if (isNewLogin) {
          showWelcomeToast(defaultUser.fullName);
        }
      } else if (data) {
        // Safely cast the database values to the required types
        const userRole = data.role as UserRole;
        const language = (data.language === 'en' || data.language === 'he') ? data.language as 'en' | 'he' : 'en';
        
        console.log("Fetched user profile from database - Role:", userRole, "Full data:", data);
        
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
        const appUser: User = {
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
          notificationPreferences: notificationPrefs,
        };
        
        console.log("Final user object created with role:", appUser.role);
        setUser(appUser);

        // Update last login time when fetching user data after login
        if (session) {
          updateLastLogin(supabaseUser.id);
        }
        
        if (isNewLogin) {
          showWelcomeToast(appUser.fullName);
        }
      } else {
        // If no profile exists, use data from auth user
        const defaultUser = createUserFromSupabaseUser(supabaseUser);
        console.log("No profile found, created default user with role:", defaultUser.role);
        setUser(defaultUser);
        
        if (isNewLogin) {
          showWelcomeToast(defaultUser.fullName);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      const defaultUser = createUserFromSupabaseUser(supabaseUser);
      console.log("Error occurred, created default user with role:", defaultUser.role);
      setUser(defaultUser);
      
      if (isNewLogin) {
        showWelcomeToast(defaultUser.fullName);
      }
    } finally {
      setIsLoading(false);
      setAuthChecked(true);
      setInitialCheckComplete(true);
    }
  };

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

  // Authentication methods
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("Attempting login for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        throw error;
      }

      if (data.user) {
        isFreshLogin.current = true;
        console.log("Login successful for user:", data.user.id, 
                   "User metadata role:", data.user.user_metadata?.role);
      }
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
      console.log("Attempting signup for:", email, "with role:", role);
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
        console.error("Signup error:", error);
        throw error;
      }

      // Success message shown when user data is successfully loaded
      console.log("Signup successful for:", email, "with role:", role, 
                 "User ID:", data.user?.id);
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
    setIsLoading(true);
    try {
      // Always clear local state first to improve UX even if server request fails
      const currentUser = user ? user.fullName || 'User' : 'User';
      
      console.log("Logging out user:", currentUser);
      
      // Attempt to sign out from Supabase
      await supabase.auth.signOut().catch(error => {
        // Just log the error, don't throw - we still want to clear local state
        console.error("Error during Supabase signout:", error);
        // If it's a 403 error, the session is already expired or invalid, which is fine
      });
      
      // Clear local state regardless of server response
      setUser(null);
      setSession(null);
      
      toast({
        title: "Logged out",
        description: `${currentUser} has been successfully logged out`,
      });
    } catch (error: any) {
      console.error("Error in logout process:", error);
      
      // Clear local state even if there's an error
      setUser(null);
      setSession(null);
      
      toast({
        title: "Logged out",
        description: "You have been logged out",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
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

  // Don't show welcome toast on initial load or when just checking auth state
  useEffect(() => {
    if (user && authChecked && !isLoading && initialCheckComplete && isFreshLogin.current) {
      console.log("Fresh login detected - showing welcome toast", user.fullName);
      showWelcomeToast(user.fullName);
    }
  }, [user, authChecked, isLoading, initialCheckComplete]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    sessionId,
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

export default AuthContext;
