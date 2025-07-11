
import React from 'react';
import { useSessionContext } from '@/context/SessionContext';

export default function StatsQuickView() {
  const { sessions, isLoading } = useSessionContext();
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats from database sessions
  const completedSessions = sessions.filter(s => !s.isActive && (s.currentStatus === 'ended' || s.status === 'completed' || !s.status));
  const totalSessions = completedSessions.length;
  
  const wins = completedSessions.filter(
    s => s.cashOut !== undefined && s.cashOut > s.buyIn
  ).length;
  
  const losses = completedSessions.filter(
    s => s.cashOut !== undefined && s.cashOut < s.buyIn
  ).length;
  
  // Calculate overall results (net profit from completed sessions)
  const overallResults = completedSessions.reduce(
    (total, session) => {
      // If session has tables, calculate from table-level data
      if (session.tables && session.tables.length > 0) {
        const completedTables = session.tables.filter(table => !table.isActive);
        const sessionResult = completedTables.reduce((sessionTotal, table) => {
          const tableBuyIn = table.buyIn || 0;
          const tableCashOut = table.cashOut !== undefined ? table.cashOut : 0;
          return sessionTotal + (tableCashOut - tableBuyIn);
        }, 0);
        return total + sessionResult;
      }
      
      // Otherwise use session-level data (legacy format)
      if (session.cashOut !== undefined && !isNaN(session.cashOut) && 
          !isNaN(session.buyIn)) {
        return total + (session.cashOut - session.buyIn);
      }
      
      return total;
    }, 0
  );
  
  // FIXED: Calculate ITM% per table instead of per session
  let totalTournamentTables = 0;
  let itmTables = 0;
  
  completedSessions.forEach(session => {
    if (session.tables && session.tables.length > 0) {
      // Count tournament tables only
      const tournamentTables = session.tables.filter(table => 
        table.format === 'Tournament' && !table.isActive
      );
      
      totalTournamentTables += tournamentTables.length;
      
      // Count tables that cashed (cashOut > 0)
      const cashedTables = tournamentTables.filter(table => 
        table.cashOut !== undefined && table.cashOut > 0
      );
      
      itmTables += cashedTables.length;
    } else if (session.format === 'Tournament' || session.format === 'Live Tournament' || session.format === 'Online Tournament') {
      // Handle sessions without separate tables (legacy format)
      totalTournamentTables += 1;
      if (session.cashOut !== undefined && session.cashOut > 0) {
        itmTables += 1;
      }
    }
  });
  
  const itmPercentage = totalTournamentTables > 0 ? (itmTables / totalTournamentTables) * 100 : 0;
  
  // Calculate total hands entered across all sessions
  const totalHands = completedSessions.reduce((total, session) => {
    let sessionHands = (session.hands?.length || 0);
    
    // Add hands from tables
    if (session.tables) {
      sessionHands += session.tables.reduce((tableTotal, table) => {
        return tableTotal + (table.hands?.length || 0);
      }, 0);
    }
    
    return total + sessionHands;
  }, 0);
  
  // Calculate average session duration
  const sessionsWithDuration = completedSessions.filter(s => 
    s.startTime && s.endTime && s.endTime > s.startTime
  );
  
  const averageDuration = sessionsWithDuration.length > 0 
    ? sessionsWithDuration.reduce((total, session) => {
        const duration = session.endTime!.getTime() - session.startTime.getTime();
        return total + duration;
      }, 0) / sessionsWithDuration.length
    : 0;
    
  // Convert average duration from milliseconds to hours
  const averageHours = averageDuration / (1000 * 60 * 60);
  
  const formattedResults = overallResults.toFixed(2);
  const resultsClass = overallResults >= 0 ? 'text-green-500' : 'text-poker-red';

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-xl font-extrabold tracking-tight mb-4 text-center">Session Stats</h2>
      
      <div className="grid grid-cols-3 gap-4 text-center mb-4">
        <div className="flex flex-col">
          <span className="text-gray-500 text-sm">Sessions</span>
          <span className="text-lg font-bold">{totalSessions}</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-gray-500 text-sm">Record</span>
          <span className="text-lg font-bold">{wins}W - {losses}L</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-gray-500 text-sm">Overall Results</span>
          <span className={`text-lg font-bold ${resultsClass}`}>
            ${formattedResults}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="flex flex-col">
          <span className="text-gray-500 text-sm">ITM %</span>
          <span className="text-lg font-bold">{itmPercentage.toFixed(1)}%</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-gray-500 text-sm">Total Hands</span>
          <span className="text-lg font-bold">{totalHands}</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-gray-500 text-sm">Avg Duration</span>
          <span className="text-lg font-bold">{averageHours.toFixed(1)}h</span>
        </div>
      </div>
    </div>
  );
}
