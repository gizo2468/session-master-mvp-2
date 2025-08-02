
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigateWithRefresh } from '@/hooks/useNavigateWithRefresh';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/Lucide';
import { useToast } from '@/hooks/use-toast';
import { useDefaultCurrency, CURRENCIES } from '@/hooks/useDefaultCurrency';
import { supabase } from '@/integrations/supabase/client';
import DonationCard from '@/components/DonationCard';
import SupportSettings from '@/components/settings/SupportSettings';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { navigateToHomeWithRefresh, isRefreshing } = useNavigateWithRefresh();
  const { user, logout, isLoading } = useAuth();
  const { toast } = useToast();
  const { defaultCurrency } = useDefaultCurrency();
  const [profile, setProfile] = useState<{ username?: string; role?: string; default_currency?: string; coaching_focus?: string[]; experience?: string } | null>(null);
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
          .select('username, role, default_currency, coaching_focus, experience')
          .eq('id', user.id)
          .maybeSingle();

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

  // Handle currency change
  const handleCurrencyChange = async (currencyCode: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ default_currency: currencyCode })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating currency:', error);
        toast({
          title: "Error",
          description: "Failed to update default currency. Please try again.",
          variant: "destructive",
        });
      } else {
        setProfile(prev => prev ? { ...prev, default_currency: currencyCode } : null);
        toast({
          title: "Success",
          description: "Default currency updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error updating currency:', error);
      toast({
        title: "Error",
        description: "Failed to update default currency. Please try again.",
        variant: "destructive",
      });
    }
  };

  const appVersion = "0.0.0"; // From package.json

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-md px-4 py-8">
        <header className="mb-8">
          <Button 
            onClick={navigateToHomeWithRefresh}
            variant="ghost"
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:bg-transparent hover:text-poker-green"
            disabled={isRefreshing}
          >
            <Icon name={isRefreshing ? "Loader2" : "ArrowLeft"} size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Back</span>
          </Button>
          <h1 className="text-2xl font-bold text-poker-black">Settings</h1>
        </header>
        
        <div className="space-y-6">
          {/* Support SessionMaster Section */}
          <DonationCard />

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
                  <Icon name="Mail" className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{user?.email || 'Not signed in'}</p>
                    <p className="text-sm text-gray-500">Email</p>
                  </div>
                </div>

                {/* Username */}
                {profileLoading ? (
                  <div className="flex items-center gap-3">
                    <Icon name="AtSign" className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <p className="text-sm text-gray-500">Username</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Icon name="AtSign" className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">@{profile?.username || 'Not set'}</p>
                      <p className="text-sm text-gray-500">Username</p>
                    </div>
                  </div>
                )}

                {/* Role */}
                {profileLoading ? (
                  <div className="flex items-center gap-3">
                    <Icon name="User" className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <p className="text-sm text-gray-500">Role</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Icon name="User" className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{getDisplayRole(profile?.role)}</p>
                      <p className="text-sm text-gray-500">Role</p>
                    </div>
                  </div>
                )}

                {/* Coaching Fields - Only show for coach users */}
                {profile?.role === 'coach' && (
                  <>
                    {/* Coaching Focus */}
                    <div className="flex items-start gap-3">
                      <Icon name="Target" className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Coaching Focus</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {profile?.coaching_focus && profile.coaching_focus.length > 0 ? (
                            profile.coaching_focus.map((focus, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {focus}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">No coaching focus areas set</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Experience */}
                    <div className="flex items-start gap-3">
                      <Icon name="Award" className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Experience</p>
                        <p className="text-sm text-gray-700 mt-1">
                          {profile?.experience || "No experience information provided"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* General Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Customize your app preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Default Currency */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name="DollarSign" className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Default Currency</p>
                      <p className="text-sm text-gray-500">Currency for new sessions</p>
                    </div>
                  </div>
                  <div className="min-w-[140px]">
                    {profileLoading ? (
                      <div className="h-9 w-full bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <Select
                        value={profile?.default_currency || 'USD'}
                        onValueChange={handleCurrencyChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           {CURRENCIES.map((currency) => (
                             <SelectItem key={currency.code} value={currency.code}>
                               {currency.name}
                             </SelectItem>
                           ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Section */}
          <SupportSettings />

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
          <p className="text-sm text-gray-500">App Version {appVersion}</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
