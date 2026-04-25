import { useEffect, useState, useCallback } from 'react';

const STEP_KEY = 'onboarding_tour_step';
const COMPLETED_KEY = 'onboarding_tour_completed';
const LEGACY_SEEN_KEY = 'onboarding_start_session_seen';
const RESET_EVENT = 'onboarding-tour:reset';
const STEP_CHANGED_EVENT = 'onboarding-tour:step-changed';

function readInitialState(): { completed: boolean; step: number } {
  if (typeof window === 'undefined') return { completed: true, step: 0 };
  try {
    // Migrate legacy "seen" flag → completed
    if (localStorage.getItem(LEGACY_SEEN_KEY) === 'true' && !localStorage.getItem(COMPLETED_KEY)) {
      localStorage.setItem(COMPLETED_KEY, 'true');
    }
    const completed = localStorage.getItem(COMPLETED_KEY) === 'true';
    const rawStep = localStorage.getItem(STEP_KEY);
    const step = rawStep ? parseInt(rawStep, 10) || 0 : 0;
    return { completed, step };
  } catch {
    return { completed: false, step: 0 };
  }
}

export function useOnboardingTour() {
  const [{ completed, step }, setState] = useState(readInitialState);

  const setStep = useCallback((next: number) => {
    try {
      localStorage.setItem(STEP_KEY, String(next));
    } catch {
      // ignore
    }
    setState((s) => ({ ...s, step: next }));
    window.dispatchEvent(new CustomEvent(STEP_CHANGED_EVENT, { detail: next }));
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(COMPLETED_KEY, 'true');
      localStorage.removeItem(STEP_KEY);
    } catch {
      // ignore
    }
    setState({ completed: true, step: 0 });
    window.dispatchEvent(new CustomEvent(STEP_CHANGED_EVENT, { detail: -1 }));
  }, []);

  // Sync across pages / tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STEP_KEY || e.key === COMPLETED_KEY) {
        setState(readInitialState());
      }
    };
    const onStepChanged = () => setState(readInitialState());
    const onReset = () => {
      try {
        localStorage.removeItem(COMPLETED_KEY);
        localStorage.removeItem(LEGACY_SEEN_KEY);
        localStorage.setItem(STEP_KEY, '0');
      } catch {
        // ignore
      }
      setState({ completed: false, step: 0 });
      window.dispatchEvent(new CustomEvent(STEP_CHANGED_EVENT, { detail: 0 }));
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(STEP_CHANGED_EVENT, onStepChanged as EventListener);
    window.addEventListener(RESET_EVENT, onReset);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(STEP_CHANGED_EVENT, onStepChanged as EventListener);
      window.removeEventListener(RESET_EVENT, onReset);
    };
  }, []);

  return {
    shouldShow: !completed,
    currentStep: step,
    setStep,
    dismiss,
  };
}

export function triggerOnboardingReset() {
  try {
    localStorage.removeItem(COMPLETED_KEY);
    localStorage.removeItem(LEGACY_SEEN_KEY);
    localStorage.setItem(STEP_KEY, '0');
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(RESET_EVENT));
}
