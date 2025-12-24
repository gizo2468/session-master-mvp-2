
import { useRef, useCallback } from 'react';

export const useFocusScroll = () => {
  const originalScrollPositionRef = useRef<{ x: number; y: number } | null>(null);

  const handleFocus = useCallback((element: HTMLElement) => {
    // Store the current scroll position before scrolling
    originalScrollPositionRef.current = {
      x: window.scrollX,
      y: window.scrollY
    };

    // Small delay to ensure the element is fully focused
    setTimeout(() => {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }, 100);
  }, []);

  const handleBlur = useCallback(() => {
    // Restore the original scroll position
    if (originalScrollPositionRef.current) {
      window.scrollTo({
        left: originalScrollPositionRef.current.x,
        top: originalScrollPositionRef.current.y,
        behavior: 'smooth'
      });
      originalScrollPositionRef.current = null;
    }
  }, []);

  return { handleFocus, handleBlur };
};
