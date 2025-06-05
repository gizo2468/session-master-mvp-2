
import { useEffect, useRef, useCallback } from 'react';
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
        // For mobile platforms, use a reasonable default height
        scrollToElement(300);
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
      let keyboardWillShowListener: any = null;
      let keyboardWillHideListener: any = null;

      // Dynamically import and setup Capacitor keyboard listeners
      const setupCapacitorListeners = async () => {
        try {
          const { Keyboard } = await import('@capacitor/keyboard');
          
          keyboardWillShowListener = await Keyboard.addListener('keyboardWillShow', (info: any) => {
            setTimeout(() => {
              scrollToElement(info.keyboardHeight || 300);
            }, 50);
          });

          keyboardWillHideListener = await Keyboard.addListener('keyboardWillHide', () => {
            restoreScroll();
          });
        } catch (error) {
          console.log('Capacitor Keyboard not available:', error);
          // Fallback to basic behavior for non-Capacitor environments
        }
      };

      setupCapacitorListeners();

      return () => {
        if (keyboardWillShowListener) {
          keyboardWillShowListener.remove();
        }
        if (keyboardWillHideListener) {
          keyboardWillHideListener.remove();
        }
      };
    }
  }, [scrollToElement, restoreScroll, platform]);

  return {
    ref: elementRef,
    onFocus: handleFocus,
    onBlur: handleBlur
  };
}
