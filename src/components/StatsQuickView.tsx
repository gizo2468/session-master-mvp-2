
import React, { useState, useEffect } from 'react';
import { fetchUserSessions } from '@/utils/database';
import { PokerSession } from '@/types/poker';

export default function StatsQuickView() {
  const [sessions, setSessions] = useState<PokerSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const userSessions = await fetchUserSessions();
      setSessions(userSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
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
      if (session.cashOut !== undefined && !isNaN(session.cashOut) && 
          !isNaN(session.buyIn)) {
        return total + (session.cashOut - session.buyIn);
      }
      return total;
    }, 0
  );
  
  // Calculate ITM% (In The Money percentage) - sessions with payout > 0
  const itmSessions = completedSessions.filter(
    s => s.cashOut !== undefined && s.cashOut > 0
  ).length;
  const itmPercentage = totalSessions > 0 ? (itmSessions / totalSessions) * 100 : 0;
  
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
