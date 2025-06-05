
import { useEffect, useRef, useCallback } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { detectPlatform } from '@/utils/platformDetection';

interface UseKeyboardAwareScrollOptions {
  offset?: number; // Additional offset above the keyboard
  enabled?: boolean; // Allow disabling the behavior
}

export const useKeyboardAwareScroll = (options: UseKeyboardAwareScrollOptions = {}) => {
  const { offset = 20, enabled = true } = options;
  const originalScrollPositionRef = useRef<number>(0);
  const isScrolledToInputRef = useRef<boolean>(false);
  const platform = detectPlatform();

  const scrollToElement = useCallback((element: HTMLElement, keyboardHeight: number) => {
    // Store original scroll position only if we haven't already scrolled for an input
    if (!isScrolledToInputRef.current) {
      originalScrollPositionRef.current = window.scrollY;
    }

    const elementRect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const availableHeight = viewportHeight - keyboardHeight;
    
    // Calculate where we want the element to be positioned (1/3 from top of available space)
    const targetPosition = availableHeight * 0.33;
    
    // Calculate how much we need to scroll
    const currentElementTop = elementRect.top;
    const scrollAdjustment = currentElementTop - targetPosition;
    
    // Only scroll if the element would be covered by keyboard or too close to the bottom
    if (currentElementTop > availableHeight - offset) {
      const newScrollPosition = window.scrollY + scrollAdjustment;
      
      window.scrollTo({
        top: Math.max(0, newScrollPosition),
        behavior: 'smooth'
      });
      
      isScrolledToInputRef.current = true;
    }
  }, [offset]);

  const restoreScrollPosition = useCallback(() => {
    if (isScrolledToInputRef.current) {
      window.scrollTo({
        top: originalScrollPositionRef.current,
        behavior: 'smooth'
      });
      isScrolledToInputRef.current = false;
    }
  }, []);

  const handleFocus = useCallback(async (element: HTMLElement) => {
    if (!enabled || platform === 'web') return;

    try {
      // Small delay to ensure keyboard is showing
      setTimeout(async () => {
        try {
          const info = await Keyboard.getInfo();
          if (info.isVisible) {
            scrollToElement(element, info.keyboardHeight);
          }
        } catch (error) {
          // Fallback for older Capacitor versions or when info is not available
          // Assume standard keyboard height based on platform
          const fallbackHeight = platform === 'ios' ? 291 : 280;
          scrollToElement(element, fallbackHeight);
        }
      }, 150);
    } catch (error) {
      console.warn('Keyboard plugin not available:', error);
    }
  }, [enabled, platform, scrollToElement]);

  const handleBlur = useCallback(() => {
    if (!enabled || platform === 'web') return;

    // Small delay to check if keyboard is actually dismissed
    setTimeout(() => {
      Keyboard.getInfo().then(info => {
        if (!info.isVisible) {
          restoreScrollPosition();
        }
      }).catch(() => {
        // Fallback: restore position after a delay
        setTimeout(restoreScrollPosition, 300);
      });
    }, 100);
  }, [enabled, platform, restoreScrollPosition]);

  useEffect(() => {
    if (!enabled || platform === 'web') return;

    const handleKeyboardHide = () => {
      restoreScrollPosition();
    };

    const handleKeyboardShow = () => {
      // Keyboard show is handled in focus event with element-specific logic
    };

    try {
      Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
      Keyboard.addListener('keyboardDidHide', handleKeyboardHide);

      return () => {
        Keyboard.removeAllListeners();
      };
    } catch (error) {
      console.warn('Keyboard listeners not available:', error);
    }
  }, [enabled, platform, restoreScrollPosition]);

  return {
    handleFocus,
    handleBlur,
    isEnabled: enabled && platform !== 'web'
  };
};
