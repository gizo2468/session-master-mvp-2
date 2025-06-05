
import { useEffect, useCallback, useRef } from 'react';
import { detectPlatform } from '@/utils/platformDetection';

interface KeyboardAwareScrollOptions {
  paddingTop?: number;
  animationDuration?: number;
  enabled?: boolean;
}

export const useKeyboardAwareScroll = (options: KeyboardAwareScrollOptions = {}) => {
  const {
    paddingTop = 20,
    animationDuration = 300,
    enabled = true
  } = options;

  const platform = detectPlatform();
  const isMobile = platform === 'ios' || platform === 'android';
  const originalScrollPositions = useRef<Map<Element, number>>(new Map());
  const keyboardHeight = useRef(0);
  const keyboardListeners = useRef<any[]>([]);

  const scrollElementIntoView = useCallback((element: HTMLElement) => {
    if (!enabled || !isMobile) return;

    const scrollContainer = findScrollableParent(element);
    const elementRect = element.getBoundingClientRect();
    const containerRect = scrollContainer === document.body 
      ? { top: 0, height: window.innerHeight }
      : scrollContainer.getBoundingClientRect();

    // Calculate if element will be covered by keyboard
    const elementBottom = elementRect.bottom;
    const keyboardTop = window.innerHeight - keyboardHeight.current;
    const willBeCovered = elementBottom > keyboardTop;

    if (willBeCovered) {
      // Store original scroll position
      if (!originalScrollPositions.current.has(scrollContainer)) {
        originalScrollPositions.current.set(scrollContainer, scrollContainer.scrollTop);
      }

      // Calculate target scroll position to center element above keyboard
      const targetPosition = elementRect.top + scrollContainer.scrollTop - 
        (keyboardTop - containerRect.top) / 2 + paddingTop;

      // Smooth scroll to target position
      scrollContainer.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: 'smooth'
      });
    }
  }, [enabled, isMobile, paddingTop]);

  const restoreScrollPosition = useCallback((element: HTMLElement) => {
    if (!enabled || !isMobile) return;

    const scrollContainer = findScrollableParent(element);
    const originalPosition = originalScrollPositions.current.get(scrollContainer);

    if (originalPosition !== undefined) {
      scrollContainer.scrollTo({
        top: originalPosition,
        behavior: 'smooth'
      });
      originalScrollPositions.current.delete(scrollContainer);
    }
  }, [enabled, isMobile]);

  const handleFocus = useCallback((event: FocusEvent) => {
    const target = event.target as HTMLElement;
    if (isInputElement(target)) {
      // Small delay to ensure keyboard is showing
      setTimeout(() => {
        scrollElementIntoView(target);
      }, 100);
    }
  }, [scrollElementIntoView]);

  const handleBlur = useCallback((event: FocusEvent) => {
    const target = event.target as HTMLElement;
    if (isInputElement(target)) {
      // Delay to allow keyboard to hide
      setTimeout(() => {
        restoreScrollPosition(target);
      }, animationDuration);
    }
  }, [restoreScrollPosition, animationDuration]);

  const setupKeyboardListeners = useCallback(async () => {
    if (!enabled || !isMobile) return;

    try {
      // Dynamically import Capacitor Keyboard plugin
      const { Keyboard } = await import('@capacitor/keyboard');
      
      // Listen for keyboard show/hide events
      const keyboardShowListener = await Keyboard.addListener('keyboardWillShow', (info: any) => {
        keyboardHeight.current = info.keyboardHeight;
        document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
      });

      const keyboardHideListener = await Keyboard.addListener('keyboardWillHide', () => {
        keyboardHeight.current = 0;
        document.body.style.setProperty('--keyboard-height', '0px');
      });

      keyboardListeners.current = [keyboardShowListener, keyboardHideListener];
    } catch (error) {
      console.log('Capacitor Keyboard plugin not available, using fallback behavior');
      // Fallback for web or when Capacitor is not available
      keyboardHeight.current = window.innerHeight * 0.3; // Estimate 30% of screen height
    }
  }, [enabled, isMobile]);

  useEffect(() => {
    if (!enabled || !isMobile) return;

    setupKeyboardListeners();

    // Add global focus/blur listeners
    document.addEventListener('focusin', handleFocus, true);
    document.addEventListener('focusout', handleBlur, true);

    return () => {
      document.removeEventListener('focusin', handleFocus, true);
      document.removeEventListener('focusout', handleBlur, true);
      
      // Clean up keyboard listeners
      keyboardListeners.current.forEach(listener => {
        if (listener && typeof listener.remove === 'function') {
          listener.remove();
        }
      });
      keyboardListeners.current = [];
    };
  }, [enabled, isMobile, handleFocus, handleBlur, setupKeyboardListeners]);

  return {
    scrollElementIntoView,
    restoreScrollPosition,
    isEnabled: enabled && isMobile
  };
};

// Helper functions
const findScrollableParent = (element: HTMLElement): Element => {
  let parent = element.parentElement;
  
  while (parent) {
    const style = window.getComputedStyle(parent);
    const isScrollable = style.overflow === 'auto' || 
                        style.overflow === 'scroll' || 
                        style.overflowY === 'auto' || 
                        style.overflowY === 'scroll';
    
    if (isScrollable && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
    parent = parent.parentElement;
  }
  
  return document.documentElement || document.body;
};

const isInputElement = (element: HTMLElement): boolean => {
  const tagName = element.tagName.toLowerCase();
  const inputTypes = ['input', 'textarea', 'select'];
  
  if (inputTypes.includes(tagName)) {
    return true;
  }
  
  // Check for contenteditable
  return element.contentEditable === 'true';
};
