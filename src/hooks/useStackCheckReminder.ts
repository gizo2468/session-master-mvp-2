import { useEffect } from 'react';
import { toast } from 'sonner';
import { useStackCheckInterval } from './useStackCheckInterval';
import { createNotification } from '@/services/notificationService';

// Global map to track last reminder count per session (persists across remounts)
// This prevents duplicate notifications when multiple component instances use this hook
const globalReminderState = new Map<string, number>();

/**
 * Hook that triggers stack check reminders during a live session
 * based on the user's configured interval in Settings.
 * 
 * Uses a global singleton to prevent duplicate reminders when
 * multiple components mount this hook simultaneously.
 * 
 * @param isSessionActive - Whether a live session is currently running
 * @param sessionStartTimeUTC - The UTC timestamp (ms) when the session started
 * @param sessionId - The ID of the current session (for notification linking)
 * @param userId - The ID of the current user (for notification)
 */
export const useStackCheckReminder = (
  isSessionActive: boolean,
  sessionStartTimeUTC: number | undefined,
  sessionId?: string,
  userId?: string
) => {
  const { interval } = useStackCheckInterval();

  // Main reminder timer effect
  useEffect(() => {
    // Don't run if session not active, no interval set, no start time, or missing IDs
    if (!isSessionActive || interval === null || !sessionStartTimeUTC || !sessionId || !userId) {
      return;
    }

    // Initialize global state for this session if needed
    if (!globalReminderState.has(sessionId)) {
      globalReminderState.set(sessionId, 0);
    }

    // Check every 30 seconds for more responsive reminders
    const checkTimer = setInterval(() => {
      const elapsedMs = Date.now() - sessionStartTimeUTC;
      const elapsedMinutes = elapsedMs / 60000;
      
      // Calculate how many reminder intervals have passed
      const intervalMinutes = interval;
      const reminderCount = Math.floor(elapsedMinutes / intervalMinutes);

      // Check against GLOBAL state (not component-local ref) to prevent duplicates
      const lastCount = globalReminderState.get(sessionId) || 0;

      // Only trigger if we've crossed a new interval threshold
      if (reminderCount > lastCount) {
        globalReminderState.set(sessionId, reminderCount);

        // Show stack check reminder toast
        toast.success('🔔 Time to check your stack!', {
          description: 'Update your chip count for accurate session tracking.',
          duration: 8000,
        });

        // Also create a notification for the Notifications screen
        createNotification({
          recipient_user_id: userId,
          type: 'stack_check',
          title: '🔔 Time to check your stack!',
          body: 'Update your chip count for accurate session tracking.',
          session_id: sessionId,
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
  }, [isSessionActive, interval, sessionStartTimeUTC, sessionId, userId]);

  // Cleanup global state when session ends
  useEffect(() => {
    if (!isSessionActive && sessionId) {
      globalReminderState.delete(sessionId);
    }
  }, [isSessionActive, sessionId]);
};
