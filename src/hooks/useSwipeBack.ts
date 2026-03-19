
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

/**
 * Detects left-edge swipe-right gestures on native iOS and triggers navigate(-1).
 * No-op on web or Android. Attach the returned ref to the page container element.
 */
export function useSwipeBack(disabled = false) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (disabled) return;

    // Only activate on native iOS
    const isNativeIOS =
      Capacitor.isNativePlatform() && /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!isNativeIOS) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch.clientX < 30) {
        startX = touch.clientX;
        startY = touch.clientY;
        tracking = true;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);

      if (dx > 80 && dx > dy * 2) {
        navigate(-1);
      }
    };

    const el = ref.current;
    if (!el) return;

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [disabled, navigate]);

  return ref;
}
