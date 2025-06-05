
import { useEffect, useRef, useCallback } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { detectPlatform } from '@/utils/platformDetection';

interface KeyboardInfo {
  keyboardHeight: number;
  isVisible: boolean;
}

export function useKeyboardAwareScroll() {
  const elementRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const originalScrollRef = useRef<{ x: number; y: number } | null>(null);
  const platform = detectPlatform();

  const scrollToElement = useCallback((keyboardHeight: number = 0) => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const availableHeight = viewportHeight - keyboardHeight;
    
    // Calculate if element is covered by keyboard
    const elementBottom = rect.bottom;
    const isElementCovered = elementBottom > availableHeight;

    if (isElementCovered) {
      // Store original scroll position
      if (!originalScrollRef.current) {
        originalScrollRef.current = {
          x: window.scrollX,
          y: window.scrollY
        };
      }

      // Calculate scroll amount to center element in available space
      const elementCenter = rect.top + rect.height / 2;
      const targetPosition = availableHeight / 2;
      const scrollAmount = elementCenter - targetPosition;
      
      // Smooth scroll to position
      window.scrollTo({
        top: window.scrollY + scrollAmount,
        left: window.scrollX,
        behavior: 'smooth'
      });
    }
  }, []);

  const restoreScroll = useCallback(() => {
    if (originalScrollRef.current) {
      window.scrollTo({
        top: originalScrollRef.current.y,
        left: originalScrollRef.current.x,
        behavior: 'smooth'
      });
      originalScrollRef.current = null;
    }
  }, []);

  const handleFocus = useCallback(async () => {
    // Small delay to ensure keyboard is showing
    setTimeout(() => {
      if (platform === 'web') {
        // For web, assume standard mobile keyboard height
        scrollToElement(250);
      } else {
        // For mobile platforms, try to get actual keyboard height
        Keyboard.getResizeMode().then(() => {
          // Use a reasonable default height for mobile keyboards
          scrollToElement(300);
        }).catch(() => {
          scrollToElement(300);
        });
      }
    }, 100);
  }, [scrollToElement, platform]);

  const handleBlur = useCallback(() => {
    // Delay to allow keyboard to hide before restoring scroll
    setTimeout(() => {
      restoreScroll();
    }, 150);
  }, [restoreScroll]);

  useEffect(() => {
    if (platform !== 'web') {
      // Listen for keyboard events on mobile
      const keyboardWillShow = Keyboard.addListener('keyboardWillShow', (info: any) => {
        setTimeout(() => {
          scrollToElement(info.keyboardHeight || 300);
        }, 50);
      });

      const keyboardWillHide = Keyboard.addListener('keyboardWillHide', () => {
        restoreScroll();
      });

      return () => {
        keyboardWillShow.remove();
        keyboardWillHide.remove();
      };
    }
  }, [scrollToElement, restoreScroll, platform]);

  return {
    ref: elementRef,
    onFocus: handleFocus,
    onBlur: handleBlur
  };
}
