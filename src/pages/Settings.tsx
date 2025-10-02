
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useNavigateWithRefresh } from '@/hooks/useNavigateWithRefresh';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencySelector } from '@/components/ui/CurrencySelector';
import Icon from '@/components/ui/Lucide';
import { useToast } from '@/hooks/use-toast';
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency';
import { supabase } from '@/integrations/supabase/client';
import SupportSettings from '@/components/settings/SupportSettings';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { navigateToHomeWithRefresh, isRefreshing } = useNavigateWithRefresh();
  const { user, logout, isLoading } = useAuth();
  const { toast } = useToast();
  const { defaultCurrency } = useDefaultCurrency();
  const [profile, setProfile] = useState<{ username?: string; role?: string; default_currency?: string; coaching_focus?: string[]; experience?: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    coaching_focus: [] as string[],
    experience: ''
  });
  const [isUsernameLoading, setIsUsernameLoading] = useState(false);

  const coachingFocusOptions = [
    'Tournaments',
    'Cash Games', 
    'GTO Tools',
    'Mental Game',
    'Bankroll Management',
    'Live Play Strategy',
    'Online Strategy'
  ];

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

  // Initialize edit form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        username: profile.username || '',
        coaching_focus: profile.coaching_focus || [],
        experience: profile.experience || ''
      });
    }
  }, [profile]);

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form to original values when canceling
      setEditForm({
        username: profile?.username || '',
        coaching_focus: profile?.coaching_focus || [],
        experience: profile?.experience || ''
      });
    }
    setIsEditing(!isEditing);
  };

  // Handle coaching focus selection with 3-tag limit
  const handleCoachingFocusToggle = (focus: string) => {
    setEditForm(prev => ({
      ...prev,
      coaching_focus: prev.coaching_focus.includes(focus)
        ? prev.coaching_focus.filter(f => f !== focus)
        : prev.coaching_focus.length < 3 
          ? [...prev.coaching_focus, focus]
          : prev.coaching_focus
    }));
  };

  // Validate username availability
  const validateUsername = async (username: string): Promise<boolean> => {
    if (!username || username === profile?.username) return true;
    
    setIsUsernameLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows returned - username is available
        return true;
      } else if (data) {
        // Username exists
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error validating username:', error);
      return false;
    } finally {
      setIsUsernameLoading(false);
    }
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!user?.id || !profile) return;

    // Validate username
    const isUsernameValid = await validateUsername(editForm.username);
    if (!isUsernameValid) {
      toast({
        title: "Username unavailable",
        description: "This username is already taken. Please choose another.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editForm.username,
          coaching_focus: editForm.coaching_focus,
          experience: editForm.experience
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      } else {
        setProfile(prev => prev ? {
          ...prev,
          username: editForm.username,
          coaching_focus: editForm.coaching_focus,
          experience: editForm.experience
        } : null);
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Profile updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

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
          {/* Account Section */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 pt-1">
                  <CardTitle>Account</CardTitle>
                  <CardDescription className="text-center">Your account information</CardDescription>
                </div>
                {!profileLoading && (
                  <div className="flex items-center gap-2 mt-2">
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEditToggle}
                          disabled={isUsernameLoading}
                        >
                          <Icon name="X" className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveChanges}
                          disabled={isUsernameLoading}
                        >
                          {isUsernameLoading ? (
                            <Icon name="Loader" className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Icon name="Check" className="h-4 w-4 mr-1" />
                          )}
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEditToggle}
                      >
                        <Icon name="Pencil" className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
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

                {/* Full Name */}
                <div className="flex items-center gap-3">
                  <Icon name="UserCircle2" className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{user?.fullName || '—'}</p>
                    <p className="text-sm text-gray-500">Full Name</p>
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
                  <div className="flex items-center gap-3 flex-1">
                    <Icon name="AtSign" className="h-5 w-5 text-gray-500" />
                    <div className="flex-1">
                      {isEditing ? (
                        <div>
                          <Input
                            value={editForm.username}
                            onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="Display handle"
                            className="max-w-[200px]"
                            autoComplete="off"
                            data-form-type="other"
                          />
                          <p className="text-sm text-gray-500 mt-1">Username</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">@{profile?.username || 'Not set'}</p>
                          <p className="text-sm text-gray-500">Username</p>
                        </div>
                      )}
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
                      <div className="flex-1">
                        <p className="font-medium">Coaching Focus</p>
                        {isEditing ? (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-2">
                              {coachingFocusOptions.map((option) => {
                                const isSelected = editForm.coaching_focus.includes(option);
                                const isDisabled = !isSelected && editForm.coaching_focus.length >= 3;
                                
                                return (
                                  <Badge
                                    key={option}
                                    variant={isSelected ? "default" : "outline"}
                                    className={`cursor-pointer transition-colors ${
                                      isSelected
                                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                        : isDisabled
                                        ? "opacity-50 cursor-not-allowed bg-gray-50"
                                        : "hover:bg-gray-100"
                                    }`}
                                    onClick={() => !isDisabled && handleCoachingFocusToggle(option)}
                                  >
                                    {option}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
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
                        )}
                      </div>
                    </div>

                    {/* Experience */}
                    <div className="flex items-start gap-3">
                      <Icon name="Award" className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">Experience</p>
                        {isEditing ? (
                          <Textarea
                            value={editForm.experience}
                            onChange={(e) => setEditForm(prev => ({ ...prev, experience: e.target.value }))}
                            placeholder="Describe your coaching experience..."
                            className="mt-1"
                            rows={3}
                          />
                        ) : (
                          <p className="text-sm text-gray-700 mt-1">
                            {profile?.experience || "No experience information provided"}
                          </p>
                        )}
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
              <CardDescription className="text-center">Customize your app preferences</CardDescription>
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
                      <CurrencySelector
                        value={profile?.default_currency || 'USD'}
                        onValueChange={handleCurrencyChange}
                        className="min-w-[140px]"
                      />
                    )}
                  </div>
                </div>

                {/* Subscription */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name="Crown" className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Subscription</p>
                      <p className="text-sm text-gray-500">Manage your premium plan</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/subscription')}
                    className="text-poker-feltGreen hover:text-poker-green"
                  >
                    <Icon name="ChevronRight" className="h-4 w-4" />
                  </Button>
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
