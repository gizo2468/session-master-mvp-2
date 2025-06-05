
import { useEffect, useCallback, useRef } from 'react';
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
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

  useEffect(() => {
    if (!enabled || !isMobile) return;

    let keyboardShowListener: any;
    let keyboardHideListener: any;

    const setupKeyboardListeners = async () => {
      try {
        // Listen for keyboard show/hide events
        keyboardShowListener = await Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
          keyboardHeight.current = info.keyboardHeight;
          document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
        });

        keyboardHideListener = await Keyboard.addListener('keyboardWillHide', () => {
          keyboardHeight.current = 0;
          document.body.style.setProperty('--keyboard-height', '0px');
        });
      } catch (error) {
        console.log('Keyboard plugin not available, using fallback behavior');
        // Fallback for web
        keyboardHeight.current = window.innerHeight * 0.3; // Estimate 30% of screen height
      }
    };

    setupKeyboardListeners();

    // Add global focus/blur listeners
    document.addEventListener('focusin', handleFocus, true);
    document.addEventListener('focusout', handleBlur, true);

    return () => {
      document.removeEventListener('focusin', handleFocus, true);
      document.removeEventListener('focusout', handleBlur, true);
      
      if (keyboardShowListener) {
        keyboardShowListener.remove();
      }
      if (keyboardHideListener) {
        keyboardHideListener.remove();
      }
    };
  }, [enabled, isMobile, handleFocus, handleBlur]);

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
