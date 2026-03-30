
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNavigateWithRefresh } from '@/hooks/useNavigateWithRefresh';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/Lucide';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SimpleSettings: React.FC = () => {
  const navigate = useNavigate();
  const { navigateToHomeWithRefresh, isRefreshing } = useNavigateWithRefresh();
  const { user, logout, isLoading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<{ username?: string; role?: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setProfileLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, role')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Helper function to display role with proper formatting
  const getDisplayRole = (role?: string) => {
    if (role === 'student') return 'Player';
    if (role === 'coach') return 'Coach';
    return role || 'Unknown';
  };

  const appVersion = "0.0.0"; // From package.json

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="container mx-auto max-w-md px-4 py-8">
        <header className="mb-8">
          <Button 
            onClick={navigateToHomeWithRefresh}
            variant="ghost"
            className="text-poker-feltGreen dark:text-primary mb-4 flex items-center gap-1 hover:bg-transparent hover:text-poker-green dark:hover:text-primary/80"
            disabled={isRefreshing}
          >
            <Icon name={isRefreshing ? "Loader2" : "ArrowLeft"} size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Back</span>
          </Button>
          <h1 className="text-2xl font-bold text-poker-black">Settings</h1>
        </header>
        
        <div className="space-y-6">
          {/* Account Section */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-center gap-3">
                  <Icon name="Mail" className="h-5 w-5 text-gray-500 dark:text-muted-foreground" />
                  <div>
                    <p className="font-medium">{user?.email || 'Not signed in'}</p>
                    <p className="text-sm text-gray-500 dark:text-muted-foreground">Email</p>
                  </div>
                </div>

                {/* Full Name */}
                  <div className="flex items-center gap-3">
                    <Icon name="UserCircle2" className="h-5 w-5 text-gray-500 dark:text-muted-foreground" />
                    <div>
                      <p className="font-medium">{user?.fullName || '—'}</p>
                      <p className="text-sm text-gray-500 dark:text-muted-foreground">Full Name</p>
                    </div>
                  </div>

                {/* Username */}
                {profileLoading ? (
                  <div className="flex items-center gap-3">
                    <Icon name="AtSign" className="h-5 w-5 text-gray-500 dark:text-muted-foreground" />
                    <div>
                      <div className="h-4 w-24 bg-gray-200 dark:bg-muted rounded animate-pulse"></div>
                      <p className="text-sm text-gray-500 dark:text-muted-foreground">Username</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Icon name="AtSign" className="h-5 w-5 text-gray-500 dark:text-muted-foreground" />
                    <div>
                      <p className="font-medium">@{profile?.username || 'Not set'}</p>
                      <p className="text-sm text-gray-500 dark:text-muted-foreground">Username</p>
                    </div>
                  </div>
                )}

                {/* Role */}
                {profileLoading ? (
                  <div className="flex items-center gap-3">
                    <Icon name="User" className="h-5 w-5 text-gray-500 dark:text-muted-foreground" />
                    <div>
                      <div className="h-4 w-16 bg-gray-200 dark:bg-muted rounded animate-pulse"></div>
                      <p className="text-sm text-gray-500 dark:text-muted-foreground">Role</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Icon name="User" className="h-5 w-5 text-gray-500 dark:text-muted-foreground" />
                    <div>
                      <p className="font-medium">{getDisplayRole(profile?.role)}</p>
                      <p className="text-sm text-gray-500 dark:text-muted-foreground">Role</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Support Section */}
          <Card>
            <CardHeader>
              <CardTitle>Support / Contact</CardTitle>
              <CardDescription>Get help or send feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = 'mailto:sessionmaster11@gmail.com'}
              >
                <Icon name="Mail" className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </CardContent>
          </Card>

          {/* Logout Section */}
          {user && (
            <Card className="border-red-200">
              <CardContent className="pt-6">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleLogout}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Icon name="Loader" className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Icon name="LogOut" className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? 'Signing out...' : 'Sign Out'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* App Version at bottom */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-muted-foreground">App Version {appVersion}</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleSettings;
