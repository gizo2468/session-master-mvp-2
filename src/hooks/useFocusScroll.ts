
import { useRef, useCallback } from 'react';

function getScrollContainer(el: HTMLElement): HTMLElement | Window {
  return (el.closest('[data-app-scroll-root]') as HTMLElement | null) ?? window;
}

export const useFocusScroll = () => {
  const originalScrollPositionRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLElement | Window | null>(null);

  const handleFocus = useCallback((element: HTMLElement) => {
    const container = getScrollContainer(element);
    containerRef.current = container;

    // Store the current scroll position before scrolling
    originalScrollPositionRef.current =
      container instanceof Window ? window.scrollY : container.scrollTop;

    // Small delay to ensure the element is fully focused and the native
    // keyboard has finished resizing the viewport before we scroll.
    setTimeout(() => {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }, 100);
  }, []);

  const handleBlur = useCallback(() => {
    const container = containerRef.current;
    if (container && originalScrollPositionRef.current !== null) {
      if (container instanceof Window) {
        window.scrollTo({ top: originalScrollPositionRef.current, behavior: 'smooth' });
      } else {
        container.scrollTo({ top: originalScrollPositionRef.current, behavior: 'smooth' });
      }
      originalScrollPositionRef.current = null;
      containerRef.current = null;
    }
  }, []);

  return { handleFocus, handleBlur };
};
