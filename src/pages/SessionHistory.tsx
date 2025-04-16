
import React from 'react';
import { useSessionContext } from '@/context/SessionContext';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FilterBar } from '@/components/ui/FilterBar';
import { useFilter } from '@/hooks/use-filter';
import Icon from '@/components/ui/Lucide';

export default function SessionHistory() {
  const { sessions } = useSessionContext();
  const navigate = useNavigate();
  
  const filterOptions = [
    { key: 'gameType', options: ['All', 'NLH', 'PLO'] },
    { key: 'format', options: ['All', 'Cash', 'Tournament'] },
  ];
  
  const { filters, filteredItems, handleFilterChange } = useFilter({
    items: sessions,
    filterOptions,
    customFilter: (session, filters) => {
      // For the new model, we need to check if ANY table in the session matches the filter
      const hasTables = session.tables && session.tables.length > 0;
      
      if (!hasTables) return false;
      
      // If gameType is not 'All', check if any table matches
      if (filters.gameType && filters.gameType !== 'All') {
        const hasMatchingGameType = session.tables.some(table => 
          table.gameType === filters.gameType
        );
        if (!hasMatchingGameType) return false;
      }
      
      // If format is not 'All', check if any table matches
      if (filters.format && filters.format !== 'All') {
        const hasMatchingFormat = session.tables.some(table => 
          table.format === filters.format
        );
        if (!hasMatchingFormat) return false;
      }
      
      // Check location if specified
      if (filters.location && session.location.toLowerCase().indexOf(filters.location.toLowerCase()) === -1) {
        return false;
      }
      
      return true;
    }
  });

  // Remove active sessions from history
  const completedSessions = filteredItems.filter(session => !session.isActive);
  
  // Calculate stats
  const totalSessions = completedSessions.length;
  
  // Calculate wins/losses based on total profit across all tables in a session
  const sessionsWithProfit = completedSessions.filter(session => {
    const totalProfit = session.tables.reduce((acc, table) => {
      if (table.cashOut !== undefined) {
        return acc + (table.cashOut - table.buyIn);
      }
      return acc;
    }, 0);
    
    return totalProfit > 0;
  });
  
  const wins = sessionsWithProfit.length;
  const losses = totalSessions - wins;
  const winRate = totalSessions > 0 ? Math.round((wins / totalSessions) * 100) : 0;
  
  // Calculate total profit
  const totalProfit = completedSessions.reduce((acc, session) => {
    const sessionProfit = session.tables.reduce((tableAcc, table) => {
      if (table.cashOut !== undefined) {
        return tableAcc + (table.cashOut - table.buyIn);
      }
      return tableAcc;
    }, 0);
    
    return acc + sessionProfit;
  }, 0);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-4 sticky top-0 z-10">
        <div className="container mx-auto max-w-md">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-1 text-poker-feltGreen"
            >
              <Icon name="ArrowLeft" size={16} />
              <span>Back</span>
            </button>
            <h1 className="font-serif text-xl font-bold">Session History</h1>
            <div className="w-10"></div> {/* Spacer for balance */}
          </div>
        </div>
      </header>
      
      <div className="container mx-auto max-w-md px-4 py-6">
        {/* Stats Summary */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-4 border-b">
            <h2 className="font-medium text-lg">Performance Summary</h2>
          </div>
          <div className="p-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{totalSessions}</div>
              <div className="text-xs text-gray-500">Sessions</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold">{winRate}%</div>
              <div className="text-xs text-gray-500">{wins}W - {losses}L</div>
            </div>
            
            <div>
              <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Net Profit</div>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="mb-6">
          <FilterBar 
            filters={filters}
            onChange={handleFilterChange}
            options={filterOptions}
          />
        </div>
        
        {/* Sessions List */}
        <div className="space-y-4">
          <h2 className="font-medium text-lg">Sessions</h2>
          
          {completedSessions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-500 mb-4">No completed sessions found.</p>
              <Link to="/new-session">
                <Button className="bg-poker-gold hover:bg-poker-darkGold text-white">
                  Start New Session
                </Button>
              </Link>
            </div>
          ) : (
            <div>
              {completedSessions.map(session => {
                // Calculate total profit for this session
                const sessionProfit = session.tables.reduce((acc, table) => {
                  if (table.cashOut !== undefined) {
                    return acc + (table.cashOut - table.buyIn);
                  }
                  return acc;
                }, 0);
                
                // Format the date
                const sessionDate = new Date(session.startTime);
                const formattedDate = sessionDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                
                return (
                  <div 
                    key={session.id} 
                    className="bg-white rounded-lg shadow-md p-4 mb-4 cursor-pointer"
                    onClick={() => navigate(`/session/${session.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{session.location}</h3>
                        <p className="text-sm text-gray-500">{formattedDate}</p>
                      </div>
                      <span className={`font-bold ${sessionProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {sessionProfit >= 0 ? '+' : ''}${Math.abs(sessionProfit).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      <p>{session.tables.length} tables</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
