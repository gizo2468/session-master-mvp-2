
import React, { useState, useEffect } from 'react';
import { SessionPersistenceService } from '@/services/sessionPersistence';
import { PokerSession } from '@/types/poker';

export default function StatsQuickView() {
  const [sessions, setSessions] = useState<PokerSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const userSessions = await SessionPersistenceService.fetchUserSessions();
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
  const completedSessions = sessions.filter(s => !s.isActive && s.status === 'completed');
  const totalSessions = completedSessions.length;
  
  const wins = completedSessions.filter(
    s => s.cashOut !== undefined && s.cashOut > s.buyIn
  ).length;
  
  const losses = completedSessions.filter(
    s => s.cashOut !== undefined && s.cashOut < s.buyIn
  ).length;
  
  // Calculate net profit from completed sessions
  const netProfit = completedSessions.reduce(
    (total, session) => {
      if (session.cashOut !== undefined && !isNaN(session.cashOut) && 
          !isNaN(session.buyIn)) {
        return total + (session.cashOut - session.buyIn);
      }
      return total;
    }, 0
  );
  
  const formattedProfit = netProfit.toFixed(2);
  const profitClass = netProfit >= 0 ? 'text-green-500' : 'text-poker-red';

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-xl font-extrabold tracking-tight mb-4 text-center">Session Stats</h2>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="flex flex-col">
          <span className="text-gray-500 text-sm">Sessions</span>
          <span className="text-lg font-bold">{totalSessions}</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-gray-500 text-sm">Record</span>
          <span className="text-lg font-bold">{wins}W - {losses}L</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-gray-500 text-sm">Net Profit</span>
          <span className={`text-lg font-bold ${profitClass}`}>
            ${formattedProfit}
          </span>
        </div>
      </div>
    </div>
  );
}
