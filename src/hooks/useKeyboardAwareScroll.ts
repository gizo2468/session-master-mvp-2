
import { useEffect, useRef, useCallback } from 'react';
import { detectPlatform } from '@/utils/platformDetection';

interface UseKeyboardAwareScrollOptions {
  offset?: number; // Additional offset above the keyboard
  enabled?: boolean; // Allow disabling the behavior
}

interface KeyboardInfo {
  keyboardHeight: number;
  isVisible: boolean;
}

export const useKeyboardAwareScroll = (options: UseKeyboardAwareScrollOptions = {}) => {
  const { offset = 20, enabled = true } = options;
  const originalScrollPositionRef = useRef<number>(0);
  const isScrolledToInputRef = useRef<boolean>(false);
  const keyboardHeightRef = useRef<number>(0);
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
      // Use dynamic import to avoid build errors when Capacitor is not available
      const { Keyboard } = await import('@capacitor/keyboard');
      
      // Small delay to ensure keyboard is showing
      setTimeout(async () => {
        try {
          // Use the keyboard height from the last keyboard show event
          const keyboardHeight = keyboardHeightRef.current || (platform === 'ios' ? 291 : 280);
          scrollToElement(element, keyboardHeight);
        } catch (error) {
          // Fallback for when keyboard info is not available
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
      // If keyboard height is 0, it means keyboard is dismissed
      if (keyboardHeightRef.current === 0) {
        restoreScrollPosition();
      }
    }, 100);
  }, [enabled, platform, restoreScrollPosition]);

  useEffect(() => {
    if (!enabled || platform === 'web') return;

    const setupKeyboardListeners = async () => {
      try {
        const { Keyboard } = await import('@capacitor/keyboard');

        const handleKeyboardShow = (info: KeyboardInfo) => {
          keyboardHeightRef.current = info.keyboardHeight;
        };

        const handleKeyboardHide = () => {
          keyboardHeightRef.current = 0;
          restoreScrollPosition();
        };

        const showListener = await Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
        const hideListener = await Keyboard.addListener('keyboardDidHide', handleKeyboardHide);

        return () => {
          showListener.remove();
          hideListener.remove();
        };
      } catch (error) {
        console.warn('Keyboard listeners not available:', error);
      }
    };

    const cleanup = setupKeyboardListeners();
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [enabled, platform, restoreScrollPosition]);

  return {
    handleFocus,
    handleBlur,
    isEnabled: enabled && platform !== 'web'
  };
};
