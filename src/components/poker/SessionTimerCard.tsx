
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { format as dateFormat } from 'date-fns';
import { useSessionContext } from '@/context/SessionContext';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';
import { useStackCheckReminder } from '@/hooks/useStackCheckReminder';
import { useAuth } from '@/context/AuthContext';
import BBStackUpdateModal from './BBStackUpdateModal';
import HandTableSelectionModal from './HandTableSelectionModal';
import { TableData } from '@/types/poker';

interface SessionTimerCardProps {
  startTime: Date;
  startTimeUTC?: number; // Raw UTC timestamp for accurate calculations
  gameType: string;
  format: string;
  smallBlind: number;
  bigBlind: number;
  currency?: string; // Currency code
  sessionId: string; // Session ID for modals
  onEndSession: () => void;
  onAddTable?: () => void;
  onBBStackUpdate?: () => void;
  activeTables?: TableData[];
  autoOpenBBStackModal?: boolean; // Auto-open modal when navigating from notification
}

const SessionTimerCard: React.FC<SessionTimerCardProps> = ({
  startTime,
  startTimeUTC,
  gameType,
  format,
  smallBlind,
  bigBlind,
  currency,
  sessionId,
  onEndSession,
  onAddTable,
  onBBStackUpdate,
  activeTables = [],
  autoOpenBBStackModal = false
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showBBStackModal, setShowBBStackModal] = useState(false);
  const [showHandTableModal, setShowHandTableModal] = useState(false);
  const { updateSessionDuration, activeSession } = useSessionContext();
  const { user } = useAuth();
  const updateCounterRef = useRef(0);

  // Stack check reminder - reads interval from user settings, now creates notifications too
  useStackCheckReminder(true, startTimeUTC, sessionId, user?.id);

  // Auto-open BB/Stack modal when navigating from notification
  useEffect(() => {
    if (autoOpenBBStackModal && activeTables.length > 0) {
      setShowBBStackModal(true);
    }
  }, [autoOpenBBStackModal, activeTables.length]);
  
  // CRITICAL FIX: Calculate duration from actual start time, not accumulated state
  const calculateActualElapsedTime = useCallback(() => {
    if (startTimeUTC) {
      // Use raw UTC timestamp for accurate calculation
      const timeSinceStart = Math.floor((Date.now() - startTimeUTC) / 1000);
      console.log('🔧 FIXED: Using UTC timestamp for duration calculation:', {
        startTimeUTC,
        currentTimeUTC: Date.now(),
        calculatedSeconds: timeSinceStart
      });
      return Math.max(0, timeSinceStart);
    } else {
      // Fallback to Date object method (less reliable across timezones)
      const timeSinceStart = Math.floor((Date.now() - startTime.getTime()) / 1000);
      console.log('🔧 FIXED: Using Date object fallback for duration calculation:', {
        startTimeGetTime: startTime.getTime(),
        currentTimeUTC: Date.now(),
        calculatedSeconds: timeSinceStart,
        WARNING: 'This path may be affected by timezone issues'
      });
      return Math.max(0, timeSinceStart);
    }
  }, [startTime, startTimeUTC]);
  
  // Use useCallback to memoize the updateDuration function
  const updateDuration = useCallback(() => {
    if (typeof updateSessionDuration === 'function' && activeSession) {
      // CRITICAL FIX: Always calculate duration from actual start time
      const actualElapsedSeconds = calculateActualElapsedTime();
      
      // Only update database every 30 seconds to reduce writes
      updateCounterRef.current++;
      if (updateCounterRef.current % 30 === 0) {
        console.log('🔧 FIXED: Updating database with actual elapsed time:', actualElapsedSeconds);
        updateSessionDuration(activeSession.id, actualElapsedSeconds);
      }
    }
  }, [updateSessionDuration, activeSession, calculateActualElapsedTime]);
  
  useEffect(() => {
    if (!startTime) return;
    
    // Set initial elapsed time using ONLY the calculated time from start timestamp
    const initialElapsedTime = calculateActualElapsedTime();
    setElapsedTime(initialElapsedTime);
    
    console.log('🔧 FIXED: SessionTimerCard initialized with correct duration:', {
      startTime,
      startTimeUTC,
      initialElapsedTime,
      formattedTime: formatTime(initialElapsedTime)
    });
    
    // Set up interval to increment locally every second for smooth display
    const timer = setInterval(() => {
      // CRITICAL FIX: Update display based on actual elapsed time, not previous state
      const currentElapsedTime = calculateActualElapsedTime();
      setElapsedTime(currentElapsedTime);
      
      // Update session duration in database periodically
      updateDuration();
    }, 1000);
    
    return () => clearInterval(timer);
  }, [startTime, startTimeUTC, calculateActualElapsedTime, updateDuration]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Use the Date object for display formatting (this is fine for display purposes)
  const formattedStartTime = dateFormat(startTime, 'HH:mm');
  const formattedDate = dateFormat(startTime, 'd MMM yyyy');
  
  // IMPORTANT: Only show blinds for Cash format - strict check to ensure it's never shown for Tournament
  const shouldShowBlinds = format === 'Cash' && smallBlind !== undefined && bigBlind !== undefined;
  const currencySymbol = getCurrencySymbol(currency);
  
  const handleEndSession = (e: React.MouseEvent) => {
    // Prevent event bubbling
    e.preventDefault();
    e.stopPropagation();
    
    // Call the provided onEndSession handler
    if (typeof onEndSession === 'function') {
      onEndSession();
    }
  };
  
  const handleAddTable = (e: React.MouseEvent) => {
    // Prevent event bubbling
    e.preventDefault();
    e.stopPropagation();
    
    // Call the provided onAddTable handler
    if (typeof onAddTable === 'function') {
      onAddTable();
    }
  };

  const handleBBStackUpdate = (e: React.MouseEvent) => {
    // Prevent event bubbling
    e.preventDefault();
    e.stopPropagation();
    
    setShowBBStackModal(true);
  };

  const handleUploadHand = (e: React.MouseEvent) => {
    // Prevent event bubbling
    e.preventDefault();
    e.stopPropagation();
    
    setShowHandTableModal(true);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center border-2" style={{ borderColor: 'hsl(43, 77%, 52%)' }}>
      <div className="mb-2 text-sm text-gray-500">Session Time</div>
      <div 
        className="text-5xl font-bold mb-3" 
        style={{ 
          fontFamily: "'DSEG7Classic', monospace",
          color: 'hsl(43, 77%, 52%)',
          WebkitTextStroke: '0.8px hsl(0, 0%, 75%)',
          textShadow: '0 0 3px hsla(43, 77%, 52%, 0.4)',
          letterSpacing: '-0.03em'
        }}
      >
        {formatTime(elapsedTime)}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-left">
          <div className="text-sm text-gray-500">Started</div>
          <div className="font-medium">{formattedStartTime}</div>
          <div className="text-xs text-gray-400">{formattedDate}</div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500">Total Tables</div>
          <div className="font-medium">{activeSession?.tables?.length || 0}</div>
          <div className="text-xs text-gray-400 mt-1">
            <div className="text-sm text-gray-500">Hands Saved</div>
            <div className="font-medium text-gray-800">
              {activeSession?.tables?.reduce((total, table) => total + (table.hands?.length || 0), 0) || 0}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="flex justify-center gap-2">
          {onAddTable && (
            <Button
              onClick={handleAddTable}
              className="bg-poker-gold hover:bg-poker-darkGold text-white flex items-center gap-2"
            >
              <Icon name="Plus" size={16} /> Add Table
            </Button>
          )}
          <Button
            onClick={handleEndSession}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Icon name="CircleStop" size={16} /> End Session
          </Button>
        </div>
        
        {/* Centered BB/Stack Update button */}
        <div className="flex justify-center">
          <Button
            onClick={handleBBStackUpdate}
            variant="outline"
            className="bg-white/50 border border-gray-200 text-gray-700 hover:bg-white hover:text-gray-900 flex items-center gap-2"
            size="sm"
          >
            <Icon name="CircleDot" size={14} /> BB/Stack Update
          </Button>
        </div>
        
        {/* Centered Upload Hand button */}
        <div className="flex justify-center">
          <Button
            onClick={handleUploadHand}
            variant="outline"
            className="bg-white/50 border border-gray-200 text-gray-700 hover:bg-white hover:text-gray-900 flex items-center gap-2"
            size="sm"
          >
            <Icon name="Hand" size={14} /> Upload Hand
          </Button>
        </div>
      </div>

      <BBStackUpdateModal
        isOpen={showBBStackModal}
        onClose={() => setShowBBStackModal(false)}
        tables={activeTables}
        sessionFormat={format}
        currency={currency}
        sessionId={sessionId}
        onDataSaved={() => {
          // Trigger any refresh callbacks passed from parent
          if (onBBStackUpdate) {
            onBBStackUpdate();
          }
        }}
      />
      
      <HandTableSelectionModal
        isOpen={showHandTableModal}
        onClose={() => setShowHandTableModal(false)}
        tables={activeTables}
        sessionId={sessionId}
      />
    </div>
  );
};

export default SessionTimerCard;
