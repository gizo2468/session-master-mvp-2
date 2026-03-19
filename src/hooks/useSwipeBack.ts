
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

/**
 * Detects native-feeling iOS left-edge swipe gestures and navigates back.
 * Only active on native iOS builds. Attach the returned ref to the page root.
 */
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

    if (disabled) {
      log('disabled');
      return;
    }

    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    const isNativeIOS = isNative && platform === 'ios';

    log('mount', {
      isNative,
      platform,
      hasElement: Boolean(element),
      historyLength: window.history.length,
      historyIndex: typeof window.history.state?.idx === 'number' ? window.history.state.idx : null,
    });

    if (!isNativeIOS) {
      log('skipped_not_native_ios');
      return;
    }

    if (!element) {
      log('skipped_no_container');
      return;
    }

    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let tracking = false;
    let cancelled = false;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        tracking = false;
        cancelled = true;
        log('touchstart_cancelled_multitouch');
        return;
      }

      const touch = event.touches[0];
      const withinEdge = touch.clientX <= EDGE_START_THRESHOLD;

      log('touchstart', {
        x: touch.clientX,
        y: touch.clientY,
        withinEdge,
      });

      if (!withinEdge) {
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
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!tracking || cancelled) return;

      if (event.touches.length !== 1) {
        tracking = false;
        cancelled = true;
        log('touchmove_cancelled_multitouch');
        return;
      }

      const touch = event.touches[0];
      lastX = touch.clientX;
      lastY = touch.clientY;

      const dx = lastX - startX;
      const dy = Math.abs(lastY - startY);

      if (dx < -12) {
        tracking = false;
        cancelled = true;
        log('touchmove_cancelled_reverse', { dx, dy });
        return;
      }

      if (dy > MAX_VERTICAL_DRIFT && dy > Math.abs(dx) * HORIZONTAL_DOMINANCE_RATIO) {
        tracking = false;
        cancelled = true;
        log('touchmove_cancelled_vertical', { dx, dy });
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!tracking || cancelled) {
        log('touchend_ignored', { tracking, cancelled });
        tracking = false;
        return;
      }

      tracking = false;

      const touch = event.changedTouches[0];
      const endX = touch?.clientX ?? lastX;
      const endY = touch?.clientY ?? lastY;
      const dx = endX - startX;
      const dy = Math.abs(endY - startY);
      const qualifies = dx >= MIN_SWIPE_DISTANCE && dx > dy * HORIZONTAL_DOMINANCE_RATIO;
      const historyIndex = typeof window.history.state?.idx === 'number' ? window.history.state.idx : null;
      const canGoBack = historyIndex !== null ? historyIndex > 0 : window.history.length > 1;

      log('touchend', {
        startX,
        startY,
        endX,
        endY,
        dx,
        dy,
        qualifies,
        canGoBack,
        historyIndex,
        fallbackPath: fallbackPath ?? null,
      });

      if (!qualifies) return;

      if (canGoBack) {
        log('navigate_back');
        navigate(-1);
        return;
      }

      if (fallbackPath) {
        log('navigate_fallback', { fallbackPath });
        navigate(fallbackPath, { replace: true });
        return;
      }

      log('no_navigation_target');
    };

    const onTouchCancel = () => {
      if (tracking) {
        log('touchcancel');
      }
      tracking = false;
      cancelled = true;
    };

    element.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    element.addEventListener('touchmove', onTouchMove, { passive: true, capture: true });
    element.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
    element.addEventListener('touchcancel', onTouchCancel, { passive: true, capture: true });
    log('listeners_attached');

    return () => {
      element.removeEventListener('touchstart', onTouchStart, true);
      element.removeEventListener('touchmove', onTouchMove, true);
      element.removeEventListener('touchend', onTouchEnd, true);
      element.removeEventListener('touchcancel', onTouchCancel, true);
      log('listeners_removed');
    };
  }, [disabled, element, fallbackPath, navigate, screenName]);

  return ref;
}
