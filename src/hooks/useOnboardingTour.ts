import { useEffect, useState, useCallback } from 'react';
import type { TourPathId } from '@/components/onboarding/tourSteps';

const STEP_KEY = 'onboarding_tour_step';
const COMPLETED_KEY = 'onboarding_tour_completed';
const PATH_KEY = 'onboarding_tour_path';
const LEGACY_SEEN_KEY = 'onboarding_start_session_seen';
const RESET_EVENT = 'onboarding-tour:reset';
const STEP_CHANGED_EVENT = 'onboarding-tour:step-changed';

interface TourState {
  completed: boolean;
  step: number;
  activePath: TourPathId | null;
}

function readInitialState(): TourState {
  if (typeof window === 'undefined') return { completed: true, step: 0, activePath: null };
  try {
    if (localStorage.getItem(LEGACY_SEEN_KEY) === 'true' && !localStorage.getItem(COMPLETED_KEY)) {
      localStorage.setItem(COMPLETED_KEY, 'true');
    }
    const completed = localStorage.getItem(COMPLETED_KEY) === 'true';
    const rawStep = localStorage.getItem(STEP_KEY);
    const step = rawStep ? parseInt(rawStep, 10) || 0 : 0;
    const rawPath = localStorage.getItem(PATH_KEY) as TourPathId | null;
    const activePath: TourPathId | null =
      rawPath === 'start-session' || rawPath === 'home-guide' || rawPath === 'dashboard-guide'
        ? rawPath
        : null;
    return { completed, step, activePath };
  } catch {
    return { completed: false, step: 0, activePath: null };
  }
}

export function useOnboardingTour() {
  const [{ completed, step, activePath }, setState] = useState(readInitialState);

  const setStep = useCallback((next: number) => {
    try {
      localStorage.setItem(STEP_KEY, String(next));
    } catch {}
    setState((s) => ({ ...s, step: next }));
    window.dispatchEvent(new CustomEvent(STEP_CHANGED_EVENT, { detail: next }));
  }, []);

  const selectPath = useCallback((id: TourPathId) => {
    try {
      localStorage.setItem(PATH_KEY, id);
      localStorage.setItem(STEP_KEY, '0');
    } catch {}
    setState((s) => ({ ...s, activePath: id, step: 0 }));
    window.dispatchEvent(new CustomEvent(STEP_CHANGED_EVENT, { detail: 0 }));
  }, []);

  const returnToMenu = useCallback(() => {
    try {
      localStorage.removeItem(PATH_KEY);
      localStorage.setItem(STEP_KEY, '0');
    } catch {}
    setState((s) => ({ ...s, activePath: null, step: 0 }));
    window.dispatchEvent(new CustomEvent(STEP_CHANGED_EVENT, { detail: 0 }));
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(COMPLETED_KEY, 'true');
      localStorage.removeItem(STEP_KEY);
      localStorage.removeItem(PATH_KEY);
    } catch {}
    setState({ completed: true, step: 0, activePath: null });
    window.dispatchEvent(new CustomEvent(STEP_CHANGED_EVENT, { detail: -1 }));
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STEP_KEY || e.key === COMPLETED_KEY || e.key === PATH_KEY) {
        setState(readInitialState());
      }
    };
    const onStepChanged = () => setState(readInitialState());
    const onReset = () => {
      try {
        localStorage.removeItem(COMPLETED_KEY);
        localStorage.removeItem(LEGACY_SEEN_KEY);
        localStorage.removeItem(PATH_KEY);
        localStorage.setItem(STEP_KEY, '0');
      } catch {}
      setState({ completed: false, step: 0, activePath: null });
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
    activePath,
    setStep,
    selectPath,
    dismiss,
  };
}

export function triggerOnboardingReset() {
  try {
    localStorage.removeItem(COMPLETED_KEY);
    localStorage.removeItem(LEGACY_SEEN_KEY);
    localStorage.removeItem(PATH_KEY);
    localStorage.setItem(STEP_KEY, '0');
  } catch {}
  window.dispatchEvent(new Event(RESET_EVENT));
}
