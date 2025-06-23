
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/Lucide';
import { useToast } from '@/hooks/use-toast';

const SimpleSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth();
  const { toast } = useToast();

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

  const appVersion = "0.0.0"; // From package.json

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-md px-4 py-8">
        <header className="mb-8">
          <Button 
            onClick={() => navigate('/')} 
            variant="ghost"
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:bg-transparent hover:text-poker-green"
          >
            <Icon name="ArrowLeft" size={16} />
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
              <div className="flex items-center gap-3">
                <Icon name="User" className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">{user?.email || 'Not signed in'}</p>
                  <p className="text-sm text-gray-500">Email</p>
                </div>
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
          <p className="text-sm text-gray-500">App Version {appVersion}</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleSettings;
