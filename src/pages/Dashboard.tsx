import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Helper function to display role with proper formatting
  const getDisplayRole = (role?: string) => {
    if (role === 'student') return 'Player';
    if (role === 'coach') return 'Coach';
    return role || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-poker-feltGreen mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto max-w-md px-4 py-4">
          <div className="flex justify-between items-center">
            <Button 
              onClick={() => navigate('/')}
              variant="ghost"
              className="text-poker-feltGreen p-0"
            >
              <Icon name="ArrowLeft" size={16} className="mr-1" />
              <span>Home</span>
            </Button>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-md px-4 py-6">
        <div className="text-center space-y-4">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-2">
              Welcome, {user.fullName || user.username}!
            </h2>
            <p className="text-gray-600 mb-4">
              Role: <span className="font-semibold">{getDisplayRole(user.role)}</span>
            </p>
            
            {user.role === 'coach' ? (
              <div className="space-y-2">
                <p className="text-lg font-medium text-poker-feltGreen">Coach Dashboard</p>
                <p className="text-sm text-gray-500">
                  Coach-specific features will be available here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium text-poker-feltGreen">Player Dashboard</p>
                <p className="text-sm text-gray-500">
                  Player-specific features will be available here.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;