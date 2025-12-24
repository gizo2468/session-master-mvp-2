import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useStackCheckInterval } from './useStackCheckInterval';

/**
 * Hook that triggers stack check reminders during a live session
 * based on the user's configured interval in Settings.
 * 
 * @param isSessionActive - Whether a live session is currently running
 * @param sessionStartTimeUTC - The UTC timestamp (ms) when the session started
 */
export const useStackCheckReminder = (
  isSessionActive: boolean,
  sessionStartTimeUTC: number | undefined
) => {
  const { interval } = useStackCheckInterval();
  const lastReminderCountRef = useRef<number>(0);
  const hasShownInitialRef = useRef<boolean>(false);

  useEffect(() => {
    // Don't run if session not active, no interval set, or no start time
    if (!isSessionActive || interval === null || !sessionStartTimeUTC) {
      // Reset when session ends or interval changes to "Never"
      lastReminderCountRef.current = 0;
      hasShownInitialRef.current = false;
      return;
    }

    // Check every 30 seconds for more responsive reminders
    const checkTimer = setInterval(() => {
      const elapsedMs = Date.now() - sessionStartTimeUTC;
      const elapsedMinutes = elapsedMs / 60000;
      
      // Calculate how many reminder intervals have passed
      const intervalMinutes = interval;
      const reminderCount = Math.floor(elapsedMinutes / intervalMinutes);

      // Only trigger if we've crossed a new interval threshold
      if (reminderCount > lastReminderCountRef.current) {
        lastReminderCountRef.current = reminderCount;

        // Show stack check reminder toast
        toast.success('🔔 Time to check your stack!', {
          description: 'Update your chip count for accurate session tracking.',
          duration: 8000,
        });

        console.log('📊 Stack check reminder triggered:', {
          elapsedMinutes: Math.floor(elapsedMinutes),
          intervalMinutes,
          reminderCount,
        });
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(checkTimer);
    };
  }, [isSessionActive, interval, sessionStartTimeUTC]);
};
