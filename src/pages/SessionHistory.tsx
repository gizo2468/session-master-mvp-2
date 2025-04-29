
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { useLanguage } from '@/context/LanguageContext';
import FilterBar from '@/components/ui/FilterBar';
import SessionCard from '@/components/SessionCard';
import Icon from '@/components/ui/Lucide';

export default function SessionHistory() {
  const navigate = useNavigate();
  const { sessions, filters } = useSessionContext();
  const { t } = useLanguage();
  
  // Filter sessions based on selected filters
  const filteredSessions = sessions.filter(session => {
    // Filter by game type
    if (filters.gameType && filters.gameType !== 'All' && session.gameType !== filters.gameType) {
      return false;
    }
    
    // Filter by format
    if (filters.format && filters.format !== 'All' && session.format !== filters.format) {
      return false;
    }
    
    // Filter by location
    if (filters.location && !session.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Sort sessions by start time (newest first)
  const sortedSessions = [...filteredSessions]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-md px-4 py-8">
        <header className="mb-8">
          <button onClick={() => navigate(-1)} className="text-poker-feltGreen mb-4 flex items-center">
            <Icon name="ArrowLeft" className="mr-1 icon-flip-rtl" size={16} />
            <span>{t('back')}</span>
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight">{t('session_history')}</h1>
        </header>
        
        <FilterBar />
        
        {sortedSessions.length > 0 ? (
          sortedSessions.map(session => (
            <SessionCard key={session.id} session={session} />
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 text-center text-gray-500">
            {t('no_sessions_found')}
          </div>
        )}
      </div>
    </div>
  );
};
