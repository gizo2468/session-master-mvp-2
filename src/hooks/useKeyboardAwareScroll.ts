
import { useEffect, useRef } from 'react';
import { detectPlatform } from '@/utils/platformDetection';

interface KeyboardInfo {
  keyboardHeight: number;
}

export const useKeyboardAwareScroll = () => {
  const elementRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const originalScrollRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isScrolledRef = useRef(false);

  useEffect(() => {
    const platform = detectPlatform();
    
    // Only apply on mobile platforms
    if (platform === 'web') return;

    const element = elementRef.current;
    if (!element) return;

    let Keyboard: any = null;

    // Dynamically import Capacitor Keyboard plugin
    const initKeyboard = async () => {
      try {
        const { Keyboard: CapKeyboard } = await import('@capacitor/keyboard');
        Keyboard = CapKeyboard;
      } catch (error) {
        console.log('Capacitor Keyboard not available, using fallback');
      }
    };

    initKeyboard();

    const handleFocus = async () => {
      // Store original scroll position
      originalScrollRef.current = {
        x: window.scrollX,
        y: window.scrollY
      };

      // Small delay to ensure keyboard is showing
      setTimeout(async () => {
        try {
          let keyboardHeight = 300; // Default fallback height

          // Try to get actual keyboard height from Capacitor
          if (Keyboard) {
            try {
              // Listen for keyboard events to get height
              const keyboardListener = await Keyboard.addListener('keyboardDidShow', (info: KeyboardInfo) => {
                keyboardHeight = info.keyboardHeight;
                scrollToElement(keyboardHeight);
              });

              // Clean up listener after a short time
              setTimeout(() => {
                keyboardListener.remove();
              }, 1000);
            } catch (error) {
              console.log('Using fallback keyboard height');
              scrollToElement(keyboardHeight);
            }
          } else {
            // Fallback for web or when Capacitor is not available
            scrollToElement(keyboardHeight);
          }
        } catch (error) {
          console.log('Error getting keyboard info, using fallback');
          scrollToElement(300);
        }
      }, 100);
    };

    const scrollToElement = (keyboardHeight: number) => {
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const availableHeight = viewportHeight - keyboardHeight;
      
      // Calculate if element is covered by keyboard
      const elementBottom = rect.bottom;
      const elementTop = rect.top;
      
      if (elementBottom > availableHeight || elementTop < 100) {
        // Calculate optimal scroll position
        const elementHeight = rect.height;
        const targetTop = Math.max(100, (availableHeight - elementHeight) / 2);
        const scrollTarget = window.scrollY + elementTop - targetTop;
        
        // Smooth scroll to position
        requestAnimationFrame(() => {
          window.scrollTo({
            top: Math.max(0, scrollTarget),
            left: window.scrollX,
            behavior: 'smooth'
          });
        });
        
        isScrolledRef.current = true;
      }
    };

    const handleBlur = () => {
      // Restore original scroll position when input loses focus
      if (isScrolledRef.current) {
        setTimeout(() => {
          requestAnimationFrame(() => {
            window.scrollTo({
              top: originalScrollRef.current.y,
              left: originalScrollRef.current.x,
              behavior: 'smooth'
            });
          });
          isScrolledRef.current = false;
        }, 150); // Small delay to ensure keyboard is hidden
      }
    };

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
    };
  }, []);

  return elementRef;
};
