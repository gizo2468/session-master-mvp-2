import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useNavigateWithRefresh } from '@/hooks/useNavigateWithRefresh';
import PlayerAllTimeChart from '@/components/PlayerAllTimeChart';
import StatsQuickView from '@/components/StatsQuickView';
import MyCoachingNetwork from '@/components/coaching/MyCoachingNetwork';
import MyNotesCard from '@/components/notes/MyNotesCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatisticsFilterModal, FilterOptions } from '@/components/StatisticsFilterModal';
import { generateStatisticsPDF } from '@/utils/pdfExport';
import { MyStatisticsSection } from '@/components/MyStatisticsSection';
import { Plus } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const focusIncomingRequests = (location.state as any)?.focusSection === 'incoming-requests';
  const { navigateToHomeWithRefresh, isRefreshing } = useNavigateWithRefresh();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [exportPDFFunction, setExportPDFFunction] = useState<(() => void) | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    timeframeType: 'default',
    timeframeValue: 'All Time',
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

  const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    setIsFilterModalOpen(false);
    // Filters are automatically applied through the filters prop to MyStatisticsSection
  };

  const handleExportPDF = (activeTab: string, statistics: any, defaultCurrency: string) => {
    const exportData = {
      activeTab,
      stats: [], // Will be populated by the PDF generator using real data
      filters,
      userName: user?.fullName || user?.username,
      statistics,
      defaultCurrency,
    };
    
    console.log('Exporting PDF with data:', exportData);
    generateStatisticsPDF(exportData);
  };

  const handleRegisterExportFunction = (exportFn: () => void) => {
    setExportPDFFunction(() => exportFn);
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
                <MyCoachingNetwork highlightIncomingRequests={focusIncomingRequests} />
                <StatsQuickView showExtendedMetrics />
                <PlayerAllTimeChart />
                <MyStatisticsSection 
                  onFilterClick={() => setIsFilterModalOpen(true)} 
                  onExportPDF={handleExportPDF}
                  onRegisterExportFunction={handleRegisterExportFunction}
                  filters={filters}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-lg font-medium text-poker-feltGreen">Dashboard</p>
                <MyCoachingNetwork highlightIncomingRequests={focusIncomingRequests} />
                <MyNotesCard />
                <StatsQuickView showExtendedMetrics />
                <PlayerAllTimeChart />
                <MyStatisticsSection 
                  onFilterClick={() => setIsFilterModalOpen(true)} 
                  onExportPDF={handleExportPDF}
                  onRegisterExportFunction={handleRegisterExportFunction}
                  filters={filters}
                />
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
        onExportPDF={() => {
          if (exportPDFFunction) {
            exportPDFFunction();
          }
        }}
      />
    </div>
  );
};

export default Dashboard;