import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'onboarding_start_session_seen';
const RESET_EVENT = 'onboarding-tour:reset';

export function useOnboardingTour() {
  const [shouldShow, setShouldShow] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem(STORAGE_KEY);
  });

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    setShouldShow(false);
  }, []);

  useEffect(() => {
    const handleReset = () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      setShouldShow(true);
    };
    window.addEventListener(RESET_EVENT, handleReset);
    return () => window.removeEventListener(RESET_EVENT, handleReset);
  }, []);

  return { shouldShow, dismiss };
}

export function triggerOnboardingReset() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(RESET_EVENT));
}
