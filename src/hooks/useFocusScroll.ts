import { useCallback } from 'react';

/**
 * Historically this hook manually scrolled focused fields into view above
 * the keyboard. Now that Keyboard.resize is set to 'native' (the WebView's
 * own viewport shrinks when the keyboard opens) and scrollable containers
 * (Dialog, AppLayout) size themselves off that same viewport, the browser's
 * own default "scroll focused element into view" behavior already handles
 * this correctly on its own. Our manual scrollIntoView was firing ~1 frame
 * after the native resize and moving things a second time, which is what
 * caused the visible jump/glitch when switching between fields. Left as a
 * no-op (rather than deleted) so existing onFocus/onBlur call sites don't
 * need to change if we ever need to reintroduce a targeted fix.
 */
export const useFocusScroll = () => {
  const handleFocus = useCallback((_element: HTMLElement) => {}, []);
  const handleBlur = useCallback(() => {}, []);

  return { handleFocus, handleBlur };
};
