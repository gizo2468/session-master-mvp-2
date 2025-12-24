
import { useEffect, useRef } from 'react';
import { useUIState } from './useUIState';

interface ScrollConfig {
  screenName: string;
  elementId?: string;
  sessionId?: string;
  throttleMs?: number;
}

export const usePersistedScrollPosition = ({ 
  screenName, 
  elementId, 
  sessionId,
  throttleMs = 500 
}: ScrollConfig) => {
  const { state, updateState, isLoading } = useUIState(screenName, sessionId);
  const throttleRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isLoading) return;

    const element = elementId ? document.getElementById(elementId) : window;
    if (!element) return;

    // Restore scroll position
    const savedScrollY = state.scrollY || 0;
    if (savedScrollY > 0) {
      if (elementId) {
        (element as HTMLElement).scrollTop = savedScrollY;
      } else {
        window.scrollTo(0, savedScrollY);
      }
    }

    // Save scroll position on scroll
    const handleScroll = () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }

      throttleRef.current = setTimeout(() => {
        const scrollY = elementId 
          ? (element as HTMLElement).scrollTop 
          : window.scrollY;
        
        updateState({ scrollY });
      }, throttleMs);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, [isLoading, elementId, screenName, sessionId, throttleMs, state.scrollY, updateState]);

  return { isLoading };
};
