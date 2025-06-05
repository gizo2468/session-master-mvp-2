
import { useEffect, useRef, useCallback } from 'react';

interface KeyboardAwareScrollOptions {
  enabled?: boolean;
  paddingTop?: number;
  animationDuration?: number;
}

export function useKeyboardAwareScroll(options: KeyboardAwareScrollOptions = {}) {
  const {
    enabled = true,
    paddingTop = 20,
    animationDuration = 300
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const originalScrollPositionRef = useRef<{ x: number; y: number } | null>(null);
  const isScrollingRef = useRef(false);

  // Detect if we're on a mobile device
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
  }, []);

  // Calculate the keyboard height based on viewport changes
  const getKeyboardHeight = useCallback(() => {
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const documentHeight = document.documentElement.clientHeight;
    return Math.max(0, documentHeight - viewportHeight);
  }, []);

  // Smooth scroll to position
  const smoothScrollTo = useCallback((targetY: number) => {
    if (isScrollingRef.current) return;
    
    isScrollingRef.current = true;
    const startY = window.pageYOffset;
    const distance = targetY - startY;
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentY = startY + (distance * easeOutCubic);
      
      window.scrollTo(0, currentY);
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        isScrollingRef.current = false;
      }
    };

    requestAnimationFrame(animateScroll);
  }, [animationDuration]);

  // Calculate optimal scroll position for focused element
  const scrollElementIntoView = useCallback(() => {
    if (!elementRef.current || !enabled || !isMobile()) return;

    const element = elementRef.current;
    const rect = element.getBoundingClientRect();
    const keyboardHeight = getKeyboardHeight();
    
    // Only proceed if keyboard is likely visible
    if (keyboardHeight < 150) return;

    // Store original scroll position if not already stored
    if (!originalScrollPositionRef.current) {
      originalScrollPositionRef.current = {
        x: window.pageXOffset,
        y: window.pageYOffset
      };
    }

    // Calculate available viewport height above keyboard
    const availableHeight = window.innerHeight - keyboardHeight;
    
    // Calculate target position to center the input in available space
    const elementHeight = rect.height;
    const targetPosition = rect.top + window.pageYOffset - 
                          (availableHeight / 2) + 
                          (elementHeight / 2) - 
                          paddingTop;

    // Ensure we don't scroll above the document
    const maxScroll = Math.max(0, targetPosition);
    
    smoothScrollTo(maxScroll);
  }, [enabled, isMobile, getKeyboardHeight, paddingTop, smoothScrollTo]);

  // Restore original scroll position
  const restoreScrollPosition = useCallback(() => {
    if (!originalScrollPositionRef.current || !enabled || !isMobile()) return;

    const { y } = originalScrollPositionRef.current;
    smoothScrollTo(y);
    
    // Clear stored position after a delay to ensure restoration is complete
    setTimeout(() => {
      originalScrollPositionRef.current = null;
    }, animationDuration + 100);
  }, [enabled, isMobile, smoothScrollTo, animationDuration]);

  // Handle focus event
  const handleFocus = useCallback(() => {
    if (!enabled || !isMobile()) return;
    
    // Small delay to ensure keyboard has started appearing
    setTimeout(() => {
      scrollElementIntoView();
    }, 100);
  }, [enabled, isMobile, scrollElementIntoView]);

  // Handle blur event
  const handleBlur = useCallback(() => {
    if (!enabled || !isMobile()) return;
    
    // Delay to ensure keyboard has started hiding
    setTimeout(() => {
      restoreScrollPosition();
    }, 150);
  }, [enabled, isMobile, restoreScrollPosition]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (originalScrollPositionRef.current) {
        const { y } = originalScrollPositionRef.current;
        window.scrollTo(0, y);
        originalScrollPositionRef.current = null;
      }
    };
  }, []);

  return {
    ref: elementRef,
    onFocus: handleFocus,
    onBlur: handleBlur
  };
}
