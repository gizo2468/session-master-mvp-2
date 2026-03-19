
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

interface UseSwipeBackOptions {
  disabled?: boolean;
  fallbackPath?: string;
  screenName?: string;
}

const EDGE_START_THRESHOLD = 44;
const MIN_SWIPE_DISTANCE = 72;
const MAX_VERTICAL_DRIFT = 56;
const HORIZONTAL_DOMINANCE_RATIO = 1.2;
const OPACITY_MIN = 0.85;
const SLIDE_OUT_DURATION = 250;
const SNAP_BACK_DURATION = 200;

export function useSwipeBack(options: boolean | UseSwipeBackOptions = false) {
  const normalizedOptions = typeof options === 'boolean'
    ? { disabled: options, fallbackPath: undefined, screenName: 'unknown' }
    : { disabled: false, fallbackPath: undefined, screenName: 'unknown', ...options };

  const { disabled, fallbackPath, screenName } = normalizedOptions;
  const navigate = useNavigate();
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  const ref = useCallback((node: HTMLDivElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    const log = (message: string, details?: Record<string, unknown>) => {
      console.info('[swipe-back]', screenName, message, details ?? {});
    };

    if (disabled) return;

    const isNativeIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

    if (!isNativeIOS || !element) return;

    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let tracking = false;
    let cancelled = false;
    let rafId = 0;

    const screenWidth = window.innerWidth;

    const clearStyles = (el: HTMLElement) => {
      el.style.transform = '';
      el.style.opacity = '';
      el.style.boxShadow = '';
      el.style.willChange = '';
      el.style.transition = '';
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        tracking = false;
        cancelled = true;
        return;
      }

      const touch = event.touches[0];
      if (touch.clientX > EDGE_START_THRESHOLD) {
        tracking = false;
        cancelled = true;
        return;
      }

      startX = touch.clientX;
      startY = touch.clientY;
      lastX = touch.clientX;
      lastY = touch.clientY;
      tracking = true;
      cancelled = false;

      // Prepare for GPU-accelerated animation
      element.style.willChange = 'transform, opacity';
      element.style.transition = 'none';
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!tracking || cancelled) return;

      if (event.touches.length !== 1) {
        tracking = false;
        cancelled = true;
        snapBack();
        return;
      }

      const touch = event.touches[0];
      lastX = touch.clientX;
      lastY = touch.clientY;

      const dx = lastX - startX;
      const dy = Math.abs(lastY - startY);

      // Cancel if swiping left
      if (dx < -12) {
        tracking = false;
        cancelled = true;
        snapBack();
        return;
      }

      // Cancel if too vertical
      if (dy > MAX_VERTICAL_DRIFT && dy > Math.abs(dx) * HORIZONTAL_DOMINANCE_RATIO) {
        tracking = false;
        cancelled = true;
        snapBack();
        return;
      }

      // Apply visual feedback via rAF
      const clampedDx = Math.max(0, dx);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!element) return;
        const progress = clampedDx / screenWidth;
        const opacity = 1 - progress * (1 - OPACITY_MIN);
        element.style.transform = `translateX(${clampedDx}px)`;
        element.style.opacity = String(opacity);
        element.style.boxShadow = clampedDx > 2
          ? `-4px 0 16px rgba(0,0,0,${0.15 * Math.min(progress * 3, 1)})`
          : 'none';
      });
    };

    const snapBack = () => {
      if (!element) return;
      element.style.transition = `transform ${SNAP_BACK_DURATION}ms ease-out, opacity ${SNAP_BACK_DURATION}ms ease-out, box-shadow ${SNAP_BACK_DURATION}ms ease-out`;
      element.style.transform = 'translateX(0)';
      element.style.opacity = '1';
      element.style.boxShadow = 'none';

      const cleanup = () => {
        clearStyles(element);
        element.removeEventListener('transitionend', cleanup);
      };
      element.addEventListener('transitionend', cleanup, { once: true });
      // Safety timeout in case transitionend doesn't fire
      setTimeout(() => clearStyles(element), SNAP_BACK_DURATION + 50);
    };

    const slideOutAndNavigate = (navigateFn: () => void) => {
      if (!element) return;
      element.style.transition = `transform ${SLIDE_OUT_DURATION}ms ease-out, opacity ${SLIDE_OUT_DURATION / 1.2}ms ease-out`;
      element.style.transform = 'translateX(100vw)';
      element.style.opacity = '0';
      element.style.boxShadow = 'none';

      const doNavigate = () => {
        clearStyles(element);
        element.removeEventListener('transitionend', doNavigate);
        navigateFn();
      };
      element.addEventListener('transitionend', doNavigate, { once: true });
      // Safety timeout
      setTimeout(() => {
        clearStyles(element);
        navigateFn();
      }, SLIDE_OUT_DURATION + 50);
    };

    const onTouchEnd = () => {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }

      if (!tracking || cancelled) {
        tracking = false;
        return;
      }

      tracking = false;

      const dx = lastX - startX;
      const dy = Math.abs(lastY - startY);
      const qualifies = dx >= MIN_SWIPE_DISTANCE && dx > dy * HORIZONTAL_DOMINANCE_RATIO;
      const historyIndex = typeof window.history.state?.idx === 'number' ? window.history.state.idx : null;
      const canGoBack = historyIndex !== null ? historyIndex > 0 : window.history.length > 1;

      if (!qualifies) {
        snapBack();
        return;
      }

      log('slide_out', { dx, canGoBack, fallbackPath });

      if (canGoBack) {
        slideOutAndNavigate(() => navigate(-1));
      } else if (fallbackPath) {
        slideOutAndNavigate(() => navigate(fallbackPath, { replace: true }));
      } else {
        snapBack();
      }
    };

    const onTouchCancel = () => {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      if (tracking) snapBack();
      tracking = false;
      cancelled = true;
    };

    element.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    element.addEventListener('touchmove', onTouchMove, { passive: true, capture: true });
    element.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
    element.addEventListener('touchcancel', onTouchCancel, { passive: true, capture: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      element.removeEventListener('touchstart', onTouchStart, true);
      element.removeEventListener('touchmove', onTouchMove, true);
      element.removeEventListener('touchend', onTouchEnd, true);
      element.removeEventListener('touchcancel', onTouchCancel, true);
      clearStyles(element);
    };
  }, [disabled, element, fallbackPath, navigate, screenName]);

  return ref;
}
