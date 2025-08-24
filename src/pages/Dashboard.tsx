import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useNavigateWithRefresh } from '@/hooks/useNavigateWithRefresh';
import PlayerAllTimeChart from '@/components/PlayerAllTimeChart';
import StatsQuickView from '@/components/StatsQuickView';
import MyCoachingNetwork from '@/components/coaching/MyCoachingNetwork';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatisticsFilterModal, FilterOptions } from '@/components/StatisticsFilterModal';
import { generateStatisticsPDF } from '@/utils/pdfExport';
import { Plus } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { navigateToHomeWithRefresh, isRefreshing } = useNavigateWithRefresh();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions');
  const [filters, setFilters] = useState<FilterOptions>({
    timeframeType: 'monthly',
    timeframeValue: 'This Month',
    gameScope: 'all',
    gameTypes: [],
    sessionFormat: [],
  });

  // Helper function to display role with proper formatting
  const getDisplayRole = (role?: string) => {
    if (role === 'student') return 'Player';
    if (role === 'coach') return 'Coach';
    return role || 'Unknown';
  };

  // Get current stats based on active tab
  const getCurrentStats = () => {
    const statsData = {
      sessions: [
        { label: 'Net Result', value: '$2,450' },
        { label: 'Net Hourly Rate', value: '$18.50' },
        { label: 'Average Net Result', value: '$102' },
        { label: 'Average Duration', value: '4.5h' },
        { label: 'Total Tables', value: '45' },
        { label: 'Duration of Play', value: '108h' },
        { label: 'Number of Sessions', value: '24' },
        { label: 'Hands Count', value: '1,247' },
      ],
      cash: [
        { label: 'Net Result', value: '$2,350' },
        { label: 'Net Hourly Rate', value: '$15.50' },
        { label: 'Average Net Result', value: '$130' },
        { label: 'Average Duration', value: '4.2h' },
        { label: 'Total Tables', value: '32' },
        { label: 'Duration of Play', value: '75h' },
        { label: 'Number of Records', value: '18' },
        { label: 'Win Ratio', value: '72%' },
      ],
      tournaments: [
        { label: 'Net Result', value: '-$1,235' },
        { label: 'Net Hourly Rate', value: '-$8.20' },
        { label: 'Average Net Result', value: '-$206' },
        { label: 'Average Duration', value: '2.5h' },
        { label: 'Total Tables', value: '13' },
        { label: 'Duration of Play', value: '15h' },
        { label: 'Number of Records', value: '6' },
        { label: 'ITM Ratio', value: '33%' },
      ],
    };
    return statsData[activeTab as keyof typeof statsData] || [];
  };

  const handleApplyFilters = () => {
    // For now, this just closes the modal
    // In the future, this will trigger data refetch with filters
    console.log('Applying filters:', filters);
  };

  const handleExportPDF = () => {
    const stats = getCurrentStats();
    const exportData = {
      activeTab: activeTab.charAt(0).toUpperCase() + activeTab.slice(1),
      stats,
      filters,
      userName: user?.fullName || user?.username,
    };
    generateStatisticsPDF(exportData);
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
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex items-center gap-2">
                      <TabsList className="grid grid-cols-3 flex-1">
                        <TabsTrigger value="sessions">Sessions</TabsTrigger>
                        <TabsTrigger value="cash">Cash</TabsTrigger>
                        <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
                      </TabsList>
                      <div className="border-l border-border pl-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsFilterModalOpen(true)}
                          className="h-10 w-10 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <TabsContent value="sessions" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Row 1: Net Result, Net Hourly Rate */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Net Result</p>
                          <p className="text-2xl font-bold text-green-600">$2,450</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Net Hourly Rate</p>
                          <p className="text-2xl font-bold">$18.50</p>
                        </div>
                        {/* Row 2: Average Net Result, Average Duration */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Average Net Result</p>
                          <p className="text-2xl font-bold">$102</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Average Duration</p>
                          <p className="text-2xl font-bold">4.5h</p>
                        </div>
                        {/* Row 3: Total Tables, Duration of Play */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Tables</p>
                          <p className="text-2xl font-bold">45</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Duration of Play</p>
                          <p className="text-2xl font-bold">108h</p>
                        </div>
                        {/* Row 4: Number of Sessions, Hands Count */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Number of Sessions</p>
                          <p className="text-2xl font-bold">24</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Hands Count</p>
                          <p className="text-2xl font-bold">1,247</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="cash" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Row 1: Net Result, Net Hourly Rate */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Net Result</p>
                          <p className="text-2xl font-bold text-green-600">$2,350</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Net Hourly Rate</p>
                          <p className="text-2xl font-bold">$15.50</p>
                        </div>
                        {/* Row 2: Average Net Result, Average Duration */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Average Net Result</p>
                          <p className="text-2xl font-bold">$130</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Average Duration</p>
                          <p className="text-2xl font-bold">4.2h</p>
                        </div>
                        {/* Row 3: Total Tables, Duration of Play */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Tables</p>
                          <p className="text-2xl font-bold">32</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Duration of Play</p>
                          <p className="text-2xl font-bold">75h</p>
                        </div>
                        {/* Row 4: Number of Records, Win Ratio */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Number of Records</p>
                          <p className="text-2xl font-bold">18</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Win Ratio</p>
                          <p className="text-2xl font-bold">72%</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="tournaments" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Row 1: Net Result, Net Hourly Rate */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Net Result</p>
                          <p className="text-2xl font-bold text-red-600">-$1,235</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Net Hourly Rate</p>
                          <p className="text-2xl font-bold text-red-600">-$8.20</p>
                        </div>
                        {/* Row 2: Average Net Result, Average Duration */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Average Net Result</p>
                          <p className="text-2xl font-bold text-red-600">-$206</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Average Duration</p>
                          <p className="text-2xl font-bold">2.5h</p>
                        </div>
                        {/* Row 3: Total Tables, Duration of Play */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Tables</p>
                          <p className="text-2xl font-bold">13</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Duration of Play</p>
                          <p className="text-2xl font-bold">15h</p>
                        </div>
                        {/* Row 4: Number of Records, ITM Ratio */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Number of Records</p>
                          <p className="text-2xl font-bold">6</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">ITM Ratio</p>
                          <p className="text-2xl font-bold">33%</p>
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
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex items-center gap-2">
                      <TabsList className="grid grid-cols-3 flex-1">
                        <TabsTrigger value="sessions">Sessions</TabsTrigger>
                        <TabsTrigger value="cash">Cash</TabsTrigger>
                        <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
                      </TabsList>
                      <div className="border-l border-border pl-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsFilterModalOpen(true)}
                          className="h-10 w-10 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <TabsContent value="sessions" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Row 1: Net Result, Net Hourly Rate */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Net Result</p>
                          <p className="text-2xl font-bold text-green-600">$2,450</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Net Hourly Rate</p>
                          <p className="text-2xl font-bold">$18.50</p>
                        </div>
                        {/* Row 2: Average Net Result, Average Duration */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Average Net Result</p>
                          <p className="text-2xl font-bold">$102</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Average Duration</p>
                          <p className="text-2xl font-bold">4.5h</p>
                        </div>
                        {/* Row 3: Total Tables, Duration of Play */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Tables</p>
                          <p className="text-2xl font-bold">45</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Duration of Play</p>
                          <p className="text-2xl font-bold">108h</p>
                        </div>
                        {/* Row 4: Number of Sessions, Hands Count */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Number of Sessions</p>
                          <p className="text-2xl font-bold">24</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Hands Count</p>
                          <p className="text-2xl font-bold">1,247</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="cash" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Row 1: Net Result, Net Hourly Rate */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Net Result</p>
                          <p className="text-2xl font-bold text-green-600">$2,350</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Net Hourly Rate</p>
                          <p className="text-2xl font-bold">$15.50</p>
                        </div>
                        {/* Row 2: Average Net Result, Average Duration */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Average Net Result</p>
                          <p className="text-2xl font-bold">$130</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Average Duration</p>
                          <p className="text-2xl font-bold">4.2h</p>
                        </div>
                        {/* Row 3: Total Tables, Duration of Play */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Tables</p>
                          <p className="text-2xl font-bold">32</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Duration of Play</p>
                          <p className="text-2xl font-bold">75h</p>
                        </div>
                        {/* Row 4: Number of Records, Win Ratio */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Number of Records</p>
                          <p className="text-2xl font-bold">18</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Win Ratio</p>
                          <p className="text-2xl font-bold">72%</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="tournaments" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Row 1: Net Result, Net Hourly Rate */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Net Result</p>
                          <p className="text-2xl font-bold text-red-600">-$1,235</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Net Hourly Rate</p>
                          <p className="text-2xl font-bold text-red-600">-$8.20</p>
                        </div>
                        {/* Row 2: Average Net Result, Average Duration */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Average Net Result</p>
                          <p className="text-2xl font-bold text-red-600">-$206</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Average Duration</p>
                          <p className="text-2xl font-bold">2.5h</p>
                        </div>
                        {/* Row 3: Total Tables, Duration of Play */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Tables</p>
                          <p className="text-2xl font-bold">13</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Duration of Play</p>
                          <p className="text-2xl font-bold">15h</p>
                        </div>
                        {/* Row 4: Number of Records, ITM Ratio */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Number of Records</p>
                          <p className="text-2xl font-bold">6</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">ITM Ratio</p>
                          <p className="text-2xl font-bold">33%</p>
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

      {/* Filter Modal */}
      <StatisticsFilterModal
        open={isFilterModalOpen}
        onOpenChange={setIsFilterModalOpen}
        filters={filters}
        onFiltersChange={setFilters}
        onApplyFilters={handleApplyFilters}
        onExportPDF={handleExportPDF}
      />
    </div>
  );
};

export default Dashboard;