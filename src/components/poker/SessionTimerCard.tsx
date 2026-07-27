import React, { useState, useEffect, useRef } from 'react';
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
  startTimeUTC?: number;
  gameType: string;
  format: string;
  smallBlind: number;
  bigBlind: number;
  currency?: string;
  sessionId: string;
  onEndSession: () => void;
  onAddTable?: () => void;
  onBBStackUpdate?: () => void;
  activeTables?: TableData[];
  autoOpenBBStackModal?: boolean;
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

  // Store stable refs — avoids re-creating interval when these change
  const startTimeUTCRef = useRef(startTimeUTC);
  const startTimeRef = useRef(startTime);
  const updateSessionDurationRef = useRef(updateSessionDuration);
  const activeSessionRef = useRef(activeSession);
  const updateCounterRef = useRef(0);

  // Keep refs in sync with latest props/values without causing re-renders
  useEffect(() => { startTimeUTCRef.current = startTimeUTC; }, [startTimeUTC]);
  useEffect(() => { startTimeRef.current = startTime; }, [startTime]);
  useEffect(() => { updateSessionDurationRef.current = updateSessionDuration; }, [updateSessionDuration]);
  useEffect(() => { activeSessionRef.current = activeSession; }, [activeSession]);

  useStackCheckReminder(true, startTimeUTC, sessionId, user?.id);

  useEffect(() => {
    if (autoOpenBBStackModal && activeTables.length > 0) {
      setShowBBStackModal(true);
    }
  }, [autoOpenBBStackModal, activeTables.length]);

  // Calculate elapsed time from refs — no dependencies needed
  const getElapsed = () => {
    const utc = startTimeUTCRef.current;
    if (utc) return Math.max(0, Math.floor((Date.now() - utc) / 1000));
    return Math.max(0, Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000));
  };

  useEffect(() => {
    // Set initial value immediately
    setElapsedTime(getElapsed());

    // Single stable interval — no dependencies that change every second
    const timer = setInterval(() => {
      const elapsed = getElapsed();
      setElapsedTime(elapsed);

      // Write to DB every 30 ticks only
      updateCounterRef.current++;
      if (updateCounterRef.current % 30 === 0) {
        const session = activeSessionRef.current;
        const updateFn = updateSessionDurationRef.current;
        if (session && typeof updateFn === 'function') {
          updateFn(session.id, elapsed);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []); // ← empty deps: interval created once, never recreated

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formattedStartTime = dateFormat(startTime, 'HH:mm');
  const formattedDate = dateFormat(startTime, 'd MMM yyyy');
  const shouldShowBlinds = format === 'Cash' && smallBlind !== undefined && bigBlind !== undefined;
  const currencySymbol = getCurrencySymbol(currency);

  const handleEndSession = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof onEndSession === 'function') onEndSession();
  };

  const handleAddTable = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof onAddTable === 'function') onAddTable();
  };

  const handleBBStackUpdate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowBBStackModal(true);
  };

  const handleUploadHand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowHandTableModal(true);
  };

  return (
    <div className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 p-6 mb-6 flex flex-col items-center">
      <div data-tour="live-overview" className="w-full flex flex-col items-center">
        <div
          className="rounded-xl mb-3 relative w-fit flex flex-col items-center dark-timer-frame"
          style={{
            border: '3px solid hsl(43, 77%, 52%)',
            outline: '1px solid hsl(43, 60%, 40%)',
            outlineOffset: '-5px',
            padding: '8px 10px',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              boxShadow: [
                '0 0 8px 2px hsla(43, 77%, 52%, 0.25)',
                '0 0 20px 4px hsla(43, 77%, 52%, 0.12)',
                '0 0 40px 8px hsla(43, 77%, 52%, 0.06)',
              ].join(', '),
            }}
          >
            <div className="mb-2 text-sm text-center" style={{ color: 'hsl(43, 40%, 45%)' }}>Session Time</div>
            <div className="relative">
              <div
                aria-hidden="true"
                className="text-5xl font-bold absolute inset-0"
                style={{
                  fontFamily: "'DSEG7Classic', monospace",
                  color: 'hsla(43, 30%, 50%, 0.1)',
                  letterSpacing: '-0.03em',
                  paddingRight: '0.03em',
                }}
              >
                {formatTime(elapsedTime).replace(/[0-9]/g, '8')}
              </div>
              <div
                className="text-5xl font-bold"
                style={{
                  fontFamily: "'DSEG7Classic', monospace",
                  color: 'hsl(43, 80%, 48%)',
                  WebkitTextStroke: '0.5px hsl(45, 78%, 55%)',
                  textShadow: '0 0 6px hsla(45, 85%, 55%, 0.5), 0 0 2px hsla(45, 85%, 58%, 0.3)',
                  letterSpacing: '-0.03em',
                  paddingRight: '0.03em',
                }}
              >
                {formatTime(elapsedTime)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 w-full">
          <div className="text-left">
            <div className="text-sm text-gray-500 dark:text-muted-foreground">Started</div>
            <div className="font-medium">{formattedStartTime}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">{formattedDate}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-muted-foreground">Total Tables</div>
            <div className="font-medium">{activeSession?.tables?.length || 0}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              <div className="text-sm text-gray-500 dark:text-muted-foreground">Hands Saved</div>
              <div className="font-medium text-gray-800 dark:text-foreground">
                {activeSession?.tables?.reduce((total, table) => total + (table.hands?.length || 0), 0) || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <div className="flex justify-center gap-2">
          {onAddTable && (
            <Button
              data-tour="live-add-table"
              onClick={handleAddTable}
              className="bg-poker-gold hover:bg-poker-darkGold text-white flex-1 w-full flex items-center justify-center gap-2"
            >
              <Icon name="Plus" size={16} /> Add Table
            </Button>
          )}
          <div data-tour="live-controls" className="flex-1">
            <Button
              onClick={handleEndSession}
              variant="destructive"
              className="w-full flex items-center justify-center gap-2"
            >
              <Icon name="CircleStop" size={16} /> End Session
            </Button>
          </div>
        </div>

        <div data-tour="live-actions" className="flex flex-col gap-2 w-full">
          <div className="flex justify-center">
            <Button
              onClick={handleBBStackUpdate}
              variant="outline"
              className="bg-white dark:bg-card/50 border border-gray-200 dark:border-border text-gray-700 dark:text-gray-300 hover:bg-white dark:bg-card hover:text-gray-900 dark:text-foreground w-full flex items-center justify-center gap-2"
              size="sm"
            >
              <Icon name="CircleDot" size={14} /> BB/Stack Update
            </Button>
          </div>
          <div className="flex justify-center">
            <Button
              onClick={handleUploadHand}
              variant="outline"
              className="bg-white dark:bg-card/50 border border-gray-200 dark:border-border text-gray-700 dark:text-gray-300 hover:bg-white dark:bg-card hover:text-gray-900 dark:text-foreground w-full flex items-center justify-center gap-2"
              size="sm"
            >
              <Icon name="Hand" size={14} /> Upload Hand
            </Button>
          </div>
        </div>
      </div>

      <BBStackUpdateModal
        isOpen={showBBStackModal}
        onClose={() => setShowBBStackModal(false)}
        tables={activeTables}
        sessionFormat={format}
        currency={currency}
        sessionId={sessionId}
        onDataSaved={() => { if (onBBStackUpdate) onBBStackUpdate(); }}
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