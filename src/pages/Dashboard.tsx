import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useNavigateWithRefresh } from '@/hooks/useNavigateWithRefresh';
import PlayerAllTimeChart from '@/components/PlayerAllTimeChart';
import StatsQuickView from '@/components/StatsQuickView';
import MyCoachingNetwork from '@/components/coaching/MyCoachingNetwork';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { navigateToHomeWithRefresh, isRefreshing } = useNavigateWithRefresh();

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
              onClick={navigateToHomeWithRefresh}
              variant="ghost"
              className="text-poker-feltGreen p-0"
              disabled={isRefreshing}
            >
              <Icon name={isRefreshing ? "Loader2" : "ArrowLeft"} size={16} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
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
            <h2 className="text-2xl font-bold mb-2 text-primary">
              Welcome, {user.fullName || user.username}!
            </h2>
            <p className="text-gray-600 mb-4">
              Role: <span className="font-semibold">{getDisplayRole(user.role)}</span>
            </p>
            
            {user.role === 'coach' ? (
              <div className="space-y-6">
                <p className="text-lg font-medium text-poker-feltGreen">Coach Dashboard</p>
                <MyCoachingNetwork />
                <StatsQuickView showExtendedMetrics />
                <PlayerAllTimeChart />
                
                {/* My Statistics Section */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 text-primary">My Statistics</h3>
                  <Tabs defaultValue="sessions" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="sessions">Sessions</TabsTrigger>
                      <TabsTrigger value="cash">Cash</TabsTrigger>
                      <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="sessions" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Sessions</p>
                          <p className="text-2xl font-bold">24</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Win Rate</p>
                          <p className="text-2xl font-bold text-green-600">67%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Avg Duration</p>
                          <p className="text-2xl font-bold">4.5h</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Hands</p>
                          <p className="text-2xl font-bold">1,247</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="cash" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Net Profit</p>
                          <p className="text-2xl font-bold text-green-600">$2,350</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Hourly Rate</p>
                          <p className="text-2xl font-bold">$15.50</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Sessions</p>
                          <p className="text-2xl font-bold">18</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Best Session</p>
                          <p className="text-2xl font-bold text-green-600">$445</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="tournaments" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Tournaments</p>
                          <p className="text-2xl font-bold">6</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">ITM Rate</p>
                          <p className="text-2xl font-bold">33%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Net Result</p>
                          <p className="text-2xl font-bold text-red-600">-$1,235</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">ROI</p>
                          <p className="text-2xl font-bold text-red-600">-18%</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-lg font-medium text-poker-feltGreen">Player Dashboard</p>
                <MyCoachingNetwork />
                <StatsQuickView showExtendedMetrics />
                <PlayerAllTimeChart />
                
                {/* My Statistics Section */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 text-primary">My Statistics</h3>
                  <Tabs defaultValue="sessions" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="sessions">Sessions</TabsTrigger>
                      <TabsTrigger value="cash">Cash</TabsTrigger>
                      <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="sessions" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Sessions</p>
                          <p className="text-2xl font-bold">24</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Win Rate</p>
                          <p className="text-2xl font-bold text-green-600">67%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Avg Duration</p>
                          <p className="text-2xl font-bold">4.5h</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Hands</p>
                          <p className="text-2xl font-bold">1,247</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="cash" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Net Profit</p>
                          <p className="text-2xl font-bold text-green-600">$2,350</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Hourly Rate</p>
                          <p className="text-2xl font-bold">$15.50</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Sessions</p>
                          <p className="text-2xl font-bold">18</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Best Session</p>
                          <p className="text-2xl font-bold text-green-600">$445</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="tournaments" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Tournaments</p>
                          <p className="text-2xl font-bold">6</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">ITM Rate</p>
                          <p className="text-2xl font-bold">33%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Net Result</p>
                          <p className="text-2xl font-bold text-red-600">-$1,235</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">ROI</p>
                          <p className="text-2xl font-bold text-red-600">-18%</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;