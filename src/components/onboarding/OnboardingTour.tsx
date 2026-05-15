import React, { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import { Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TourPathId } from '@/components/onboarding/tourSteps';

export interface TourStep {
  selector: string;
  title: string;
  body: string;
  /** When true, the spotlight is click-through and underlying UI stays interactive. */
  interactive?: boolean;
  /** When true, render a circular spotlight instead of a rounded rectangle. */
  circle?: boolean;
  /** Optional pre-step hook: open accordions, switch tabs, etc. before measuring. */
  prepare?: () => void | Promise<void>;
  /** When true, the tooltip uses tighter padding/gap. */
  compact?: boolean;
  /** Force tooltip placement relative to the spotlight. Defaults to auto. */
  placement?: 'auto' | 'above' | 'below';
}

interface OnboardingTourProps {
  steps: TourStep[];
  onClose: () => void;
  /** Optional controlled step index. If omitted, the component manages it internally. */
  currentStep?: number;
  /** Called whenever the active step changes (Next / Previous / programmatic advance). */
  onStepChange?: (next: number) => void;
  /** Currently selected tutorial path. When null, the welcome menu is shown. */
  activePath?: TourPathId | null;
  /** Called when the user picks a tutorial path from the welcome menu. */
  onSelectPath?: (id: TourPathId) => void;
  /** Called when the user wants to go back to the welcome menu from a sub-guide. */
  onReturnToMenu?: () => void;
}

const PADDING = 10;
const RADIUS = 14;
const TOOLTIP_GAP = 16;
const TOOLTIP_MAX_WIDTH = 320;
const TOOLTIP_MIN_WIDTH = 240;
const VIEWPORT_MARGIN = 12;

export default function OnboardingTour({
  steps,
  onClose,
  currentStep: controlledStep,
  onStepChange,
  activePath = null,
  onSelectPath,
  onReturnToMenu,
}: OnboardingTourProps) {
  const isMenu = activePath === null;
  const isControlled = typeof controlledStep === 'number';
  const [internalStep, setInternalStep] = useState(0);
  const currentStep = isControlled ? Math.max(0, Math.min(controlledStep!, steps.length - 1)) : internalStep;

  const setStep = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(next, steps.length - 1));
      if (!isControlled) setInternalStep(clamped);
      onStepChange?.(clamped);
    },
    [isControlled, onStepChange, steps.length]
  );

  const [rect, setRect] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 0,
    h: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipHeight, setTooltipHeight] = useState(200);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const measureTimer = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);
  const hadRectRef = useRef(false);
  // Direction the user last navigated. Used to skip missing/conditional steps
  // in the same direction so Previous never bounces forward and vice versa.
  const directionRef = useRef<1 | -1>(1);
  // Freeze flag: while true, we pause rect/viewport updates so the spotlight
  // and tooltip stay rock-solid (e.g. when an input inside the highlighted area
  // is focused and the mobile keyboard opens).
  const frozenRef = useRef(false);

  const step = steps[currentStep];
  const getVisibleElement = useCallback((selector: string) => {
    const matches = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    return matches.find((el) => {
      const style = window.getComputedStyle(el);
      const bounds = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && bounds.width > 0 && bounds.height > 0;
    }) ?? matches[0] ?? null;
  }, []);
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;
  const isStartSessionStep = step?.selector === '[data-tour="start-session"]';
  const isStakesStep = step?.selector === '[data-tour="stakes"]';
  const isSubmitSessionStep = step?.selector === '[data-tour="submit-session"]';
  const isGameSetupStep = step?.selector === '[data-tour="game-setup"]';
  const isLiveOverviewStep = step?.selector === '[data-tour="live-overview"]';
  const isTableActionsStep = step?.selector === '[data-tour="table-actions"]';
  const isEndTableCashoutStep = step?.selector === '[data-tour="end-table-cashout"]';
  const isEndTableConfirmStep = step?.selector === '[data-tour="end-table-confirm"]';
  const showTapHand = isStartSessionStep || isStakesStep || isSubmitSessionStep;
  const hideNextButton = isStartSessionStep || isSubmitSessionStep || isTableActionsStep || isEndTableCashoutStep || isEndTableConfirmStep;
  const hidePreviousButton = isGameSetupStep || isLiveOverviewStep;

  // Gate: on the Stakes step, require the Buy-in input to have a positive value.
  const [buyInFilled, setBuyInFilled] = useState(false);
  useEffect(() => {
    if (!isStakesStep) return;
    const container = document.querySelector('[data-tour="stakes"]') as HTMLElement | null;
    if (!container) return;
    const input =
      (container.querySelector('input[inputmode="decimal"]') as HTMLInputElement | null) ??
      (container.querySelector('input[type="number"]') as HTMLInputElement | null) ??
      (container.querySelector('input') as HTMLInputElement | null);
    if (!input) return;
    const evaluate = () => {
      const raw = (input.value || '').replace(/,/g, '.').trim();
      if (raw === '') {
        setBuyInFilled(false);
        return;
      }
      const v = parseFloat(raw);
      // Allow 0 (freeroll) — any finite numeric value counts.
      setBuyInFilled(Number.isFinite(v));
    };
    evaluate();
    input.addEventListener('input', evaluate);
    input.addEventListener('change', evaluate);
    return () => {
      input.removeEventListener('input', evaluate);
      input.removeEventListener('change', evaluate);
    };
  }, [isStakesStep, rect]);
  const nextDisabled = isStakesStep && !buyInFilled;

  // Lightweight rect read — no scroll-into-view, no state churn if unchanged.
  const readRect = useCallback(() => {
    if (!step) return;
    if (frozenRef.current) return;
    const el = getVisibleElement(step.selector);
    if (!el) {
      setRect((prev) => (prev === null ? prev : null));
      return;
    }
    const r = el.getBoundingClientRect();
    setRect((prev) => {
      if (
        prev &&
        prev.top === r.top &&
        prev.left === r.left &&
        prev.width === r.width &&
        prev.height === r.height
      ) {
        return prev;
      }
      return r;
    });
  }, [getVisibleElement, step]);

  // Step-change effect: run prepare hook, then poll for the element until found
  // (or auto-skip after retries). NO smooth scrollIntoView — that causes the
  // spotlight/tooltip to drift visibly. We snap directly to the rect instead.
  useLayoutEffect(() => {
    setTooltipVisible(false);
    hadRectRef.current = false;
    setRect(null);
    if (measureTimer.current) window.clearTimeout(measureTimer.current);

    let cancelled = false;
    let attempts = 0;

    // Programmatically center the target inside the real scroll container.
    // We DO NOT touch overflow/height locks here — `overflow: hidden` does not
    // block programmatic scrollTop writes, so the user-level scroll lock stays
    // fully intact while we still snap the page into place.
    const scrollTargetIntoCenter = (el: HTMLElement) => {
      // Dialog/portal targets are position:fixed and already centered in the viewport.
      // Scrolling the app root drifts the underlying page and makes the spotlight
      // rect land off-screen on small viewports. Short-circuit for them.
      if (el.closest('[role="dialog"]')) return Promise.resolve();
      const appRoot = document.querySelector('[data-app-scroll-root="true"]') as HTMLElement | null;
      const container: HTMLElement | null =
        appRoot ?? (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
      if (!container) return Promise.resolve();
      const targetRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      // Anchor the highlighted element near the TOP of the container so the
      // tooltip has plenty of room below it on short mobile viewports.
      const TOP_OFFSET = 80;
      const deltaY = targetRect.top - containerRect.top - TOP_OFFSET;
      const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
      const nextTop = Math.max(0, Math.min(maxScroll, container.scrollTop + deltaY));
      try {
        container.scrollTo({ top: nextTop, behavior: 'auto' });
      } catch {
        container.scrollTop = nextTop;
      }
      return new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });
    };

    // Modal-step selectors mount inside a Radix portal that may take longer
    // than 640ms to appear (animation + focus trap). Use a generous retry
    // window so we never auto-skip the End Table popup steps.
    const isModalStep =
      step?.selector === '[data-tour="end-table-intro"]' ||
      step?.selector === '[data-tour="end-table-cashout"]' ||
      step?.selector === '[data-tour="end-table-profit"]' ||
      step?.selector === '[data-tour="end-table-notes"]' ||
      step?.selector === '[data-tour="end-table-confirm"]';
    const maxAttempts = isModalStep ? 60 : 8; // ~4.8s vs ~640ms

    const focusAndMeasure = async () => {
      if (cancelled || !step) return;
      const el = getVisibleElement(step.selector);
      if (!el) {
        // Short retry window for elements that mount after a prepare() hook.
        if (attempts < maxAttempts) {
          attempts++;
          measureTimer.current = window.setTimeout(focusAndMeasure, 80);
          return;
        }
        // Skip in the direction the user navigated. If we run off either end,
        // close gracefully (forward = finish, backward = return to menu/first).
        const dir = directionRef.current;
        const next = currentStep + dir;
        if (next < 0) {
          onReturnToMenu?.();
          return;
        }
        if (next > steps.length - 1) {
          onClose();
          return;
        }
        setStep(next);
        return;
      }
      await scrollTargetIntoCenter(el);
      if (cancelled) return;
      readRect();
      // Two rAFs: ensure layout settled (esp. after prepare()) before reveal.
      window.requestAnimationFrame(() => {
        if (cancelled) return;
        readRect();
        window.requestAnimationFrame(() => {
          if (cancelled) return;
          setTooltipVisible(true);
          if (isModalStep) {
            // Radix dialog enter animation is ~150ms; re-measure after it settles
            // so the spotlight snaps onto the post-transform rect.
            measureTimer.current = window.setTimeout(() => {
              if (cancelled) return;
              readRect();
            }, 220);
          }
        });
      });
    };

    const run = async () => {
      try {
        await step?.prepare?.();
      } catch {
        /* ignore */
      }
      if (cancelled) return;
      measureTimer.current = window.setTimeout(focusAndMeasure, 60);
    };
    run();

    return () => {
      cancelled = true;
      if (measureTimer.current) window.clearTimeout(measureTimer.current);
    };
  }, [currentStep, step, readRect, setStep, isLast, getVisibleElement]);

  // Track when we have a rect (to enable position transitions only after first paint).
  useEffect(() => {
    if (rect) hadRectRef.current = true;
  }, [rect]);

  // rAF-throttled scroll/resize tracking — keeps spotlight glued to the target
  // without fighting the user's scroll.
  useEffect(() => {
    let scheduled = false;
    const tick = () => {
      scheduled = false;
      rafId.current = null;
      if (frozenRef.current) return;
      readRect();
    };
    const schedule = () => {
      if (frozenRef.current) return;
      if (scheduled) return;
      scheduled = true;
      rafId.current = window.requestAnimationFrame(tick);
    };
    const onResize = () => {
      if (frozenRef.current) return;
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      schedule();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', schedule, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', schedule, true);
      if (rafId.current) window.cancelAnimationFrame(rafId.current);
    };
  }, [readRect]);

  // STRICT scroll & interaction lockdown across html, body, AND the app's
  // real scroll root (AppLayout's `fixed inset-0 overflow-y-auto` div). Without
  // locking the app scroll root, the background drifts and the spotlight feels
  // detached. We also block wheel/touchmove/scroll-keys as a hard fallback.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const appRoot = document.querySelector('[data-app-scroll-root="true"]') as HTMLElement | null;

    const targets: Array<{ el: HTMLElement; prev: Record<string, string> }> = [];
    const lock = (el: HTMLElement) => {
      targets.push({
        el,
        prev: {
          overflow: el.style.overflow,
          height: el.style.height,
          touchAction: el.style.touchAction,
          overscrollBehavior: el.style.overscrollBehavior,
        },
      });
      el.style.overflow = 'hidden';
      el.style.height = '100vh';
      el.style.touchAction = 'none';
      el.style.overscrollBehavior = 'none';
    };
    lock(html);
    lock(body);
    if (appRoot) lock(appRoot);

    // Allow scroll/touch only inside the tooltip card OR opt-in [data-tour-allow] elements; block everything else.
    const isInsideTooltip = (target: EventTarget | null) =>
      target instanceof Node && tooltipRef.current?.contains(target);
    const isInsideAllowed = (target: EventTarget | null) =>
      target instanceof Element && !!target.closest('[data-tour-allow="true"]');
    const blockEvent = (e: Event) => {
      if (isInsideTooltip(e.target) || isInsideAllowed(e.target)) return;
      e.preventDefault();
    };
    const blockKeys = (e: KeyboardEvent) => {
      if (isInsideTooltip(e.target) || isInsideAllowed(e.target)) return;
      const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'];
      if (keys.includes(e.key)) e.preventDefault();
    };
    window.addEventListener('wheel', blockEvent, { passive: false });
    window.addEventListener('touchmove', blockEvent, { passive: false });
    window.addEventListener('keydown', blockKeys);

    return () => {
      targets.forEach(({ el, prev }) => {
        el.style.overflow = prev.overflow;
        el.style.height = prev.height;
        el.style.touchAction = prev.touchAction;
        el.style.overscrollBehavior = prev.overscrollBehavior;
      });
      window.removeEventListener('wheel', blockEvent);
      window.removeEventListener('touchmove', blockEvent);
      window.removeEventListener('keydown', blockKeys);
    };
  }, []);

  // Lift opted-in elements (e.g. Back button) above the overlay so they remain
  // visible AND clickable while the tour is active. Restored on unmount.
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>('[data-tour-allow="true"]')
    );
    const prev = els.map((el) => ({
      el,
      position: el.style.position,
      zIndex: el.style.zIndex,
      pointerEvents: el.style.pointerEvents,
    }));
    els.forEach((el) => {
      if (!el.style.position || el.style.position === 'static') {
        el.style.position = 'relative';
      }
      el.style.zIndex = '101';
      el.style.pointerEvents = 'auto';
    });
    return () => {
      prev.forEach(({ el, position, zIndex, pointerEvents }) => {
        el.style.position = position;
        el.style.zIndex = zIndex;
        el.style.pointerEvents = pointerEvents;
      });
    };
  }, [currentStep, activePath]);

  // Detect whether the current spotlight target lives inside a Radix Dialog.
  // When it does, we MUST NOT cover the dialog with our dim bands (the dialog
  // already has its own overlay). We simply let the tour's transparent root
  // sit above the dialog so the spotlight stroke and tooltip remain visible,
  // while the dialog content is fully visible and interactive below them.
  const [stepInsideDialog, setStepInsideDialog] = useState(false);
  useEffect(() => {
    if (!step) {
      setStepInsideDialog(false);
      return;
    }
    const target = getVisibleElement(step.selector);
    const dialogContent = target?.closest('[role="dialog"]') as HTMLElement | null;
    setStepInsideDialog(!!dialogContent);
  }, [step, currentStep, activePath, rect, getVisibleElement]);

  // Safety net: on unmount force-clear any leftover lock styles/classes so the
  // app is fully interactive after the tour closes or unmounts mid-transition.
  useEffect(() => {
    return () => {
      const html = document.documentElement;
      const body = document.body;
      const appRoot = document.querySelector('[data-app-scroll-root="true"]') as HTMLElement | null;
      [html, body, appRoot].forEach((node) => {
        if (!node) return;
        node.style.overflow = '';
        node.style.height = '';
        node.style.touchAction = '';
        node.style.overscrollBehavior = '';
      });
      document.body.classList.remove('onboarding-pulse-active');
    };
  }, []);

  // Observe size changes on the spotlighted element (e.g. accordion expanding)
  // so the spotlight re-measures immediately instead of waiting for scroll/resize.
  useEffect(() => {
    if (!step || typeof ResizeObserver === 'undefined') return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (frozenRef.current) return;
      readRect();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [step, readRect, currentStep]);

  // Freeze the tour position while an input/textarea inside the highlighted
  // area is focused, OR while the mobile keyboard is detected as open via
  // visualViewport. Prevents the tooltip & spotlight from jumping when iOS
  // opens the keyboard and shrinks innerHeight / auto-scrolls the field.
  useEffect(() => {
    if (!step) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) return;

    const isEditable = (t: EventTarget | null) => {
      if (!(t instanceof HTMLElement)) return false;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return true;
      if (t.isContentEditable) return true;
      return false;
    };
    const isInsideHighlighted = (t: EventTarget | null) =>
      t instanceof Node && el.contains(t);

    let focusFrozen = false;
    let keyboardFrozen = false;
    let unfreezeTimer: number | null = null;
    let restoreTimers: number[] = [];
    const appRoot = document.querySelector('[data-app-scroll-root="true"]') as HTMLElement | null;
    // Snapshot of scroll positions captured the moment the user taps an
    // editable field. Used to undo any iOS focus-induced scroll-into-view.
    let snap = {
      win: { x: 0, y: 0 },
      html: 0,
      body: 0,
      app: 0,
    };
    const captureScroll = () => {
      snap = {
        win: { x: window.scrollX, y: window.scrollY },
        html: document.documentElement.scrollTop,
        body: document.body.scrollTop,
        app: appRoot ? appRoot.scrollTop : 0,
      };
    };
    const restoreScroll = () => {
      if (window.scrollX !== snap.win.x || window.scrollY !== snap.win.y) {
        window.scrollTo(snap.win.x, snap.win.y);
      }
      if (document.documentElement.scrollTop !== snap.html) {
        document.documentElement.scrollTop = snap.html;
      }
      if (document.body.scrollTop !== snap.body) {
        document.body.scrollTop = snap.body;
      }
      if (appRoot && appRoot.scrollTop !== snap.app) {
        appRoot.scrollTop = snap.app;
      }
    };
    const sync = () => {
      frozenRef.current = focusFrozen || keyboardFrozen;
    };
    const cancelUnfreeze = () => {
      if (unfreezeTimer !== null) {
        window.clearTimeout(unfreezeTimer);
        unfreezeTimer = null;
      }
    };
    const clearRestoreTimers = () => {
      restoreTimers.forEach((t) => window.clearTimeout(t));
      restoreTimers = [];
    };
    // Scroll-guard: while focused, immediately undo any scroll the browser
    // performs (iOS focus-into-view side effect).
    const onScrollGuard = () => {
      if (!focusFrozen) return;
      restoreScroll();
    };

    // Pre-emptive freeze + scroll snapshot. Run on pointerdown/mousedown so we
    // capture state BEFORE iOS begins its auto-scroll-to-input.
    const onPointerDown = (e: Event) => {
      if (!isInsideHighlighted(e.target)) return;
      if (!isEditable(e.target)) return;
      cancelUnfreeze();
      captureScroll();
      focusFrozen = true;
      sync();
    };

    // mousedown intercept: prevent the default focus path that triggers iOS
    // scroll-into-view, then focus the input ourselves with preventScroll.
    const onMouseDown = (e: MouseEvent) => {
      if (!isInsideHighlighted(e.target)) return;
      if (!isEditable(e.target)) return;
      const target = e.target as HTMLElement;
      cancelUnfreeze();
      captureScroll();
      focusFrozen = true;
      sync();
      e.preventDefault();
      try {
        (target as HTMLInputElement).focus({ preventScroll: true });
      } catch {
        target.focus();
      }
    };

    const onFocusIn = (e: FocusEvent) => {
      if (!isInsideHighlighted(e.target)) return;
      if (!isEditable(e.target)) return;
      cancelUnfreeze();
      // Capture only if we haven't already (pointerdown should have fired first).
      if (!focusFrozen) captureScroll();
      focusFrozen = true;
      sync();
      // Repeatedly restore scroll over the first ~400ms to defeat any
      // delayed iOS focus-scroll that slips past preventScroll.
      clearRestoreTimers();
      [0, 30, 80, 160, 280, 400].forEach((ms) => {
        restoreTimers.push(
          window.setTimeout(() => {
            if (focusFrozen) restoreScroll();
          }, ms)
        );
      });
      window.requestAnimationFrame(() => {
        if (focusFrozen) restoreScroll();
      });
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!isInsideHighlighted(e.target)) return;
      focusFrozen = false;
      clearRestoreTimers();
      // Delay the actual unfreeze + re-measure so the iOS keyboard has time to
      // fully collapse and any auto-scroll has settled. Prevents a second jump.
      cancelUnfreeze();
      unfreezeTimer = window.setTimeout(() => {
        unfreezeTimer = null;
        sync();
        if (frozenRef.current) return;
        setViewport({ w: window.innerWidth, h: window.innerHeight });
        readRect();
      }, 280);
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('touchstart', onPointerDown, true);
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);
    window.addEventListener('scroll', onScrollGuard, true);
    appRoot?.addEventListener('scroll', onScrollGuard, true);

    const vv = window.visualViewport;
    const onVVResize = () => {
      if (!vv) return;
      const delta = window.innerHeight - vv.height;
      const open = delta > 100; // heuristic: keyboard open
      if (open) {
        cancelUnfreeze();
        keyboardFrozen = true;
        sync();
        if (focusFrozen) restoreScroll();
      } else {
        keyboardFrozen = false;
        // Delay unfreeze on keyboard close as well.
        cancelUnfreeze();
        unfreezeTimer = window.setTimeout(() => {
          unfreezeTimer = null;
          sync();
          if (frozenRef.current) return;
          setViewport({ w: window.innerWidth, h: window.innerHeight });
          readRect();
        }, 280);
      }
    };
    vv?.addEventListener('resize', onVVResize);

    return () => {
      cancelUnfreeze();
      clearRestoreTimers();
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('touchstart', onPointerDown, true);
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('focusout', onFocusOut, true);
      window.removeEventListener('scroll', onScrollGuard, true);
      appRoot?.removeEventListener('scroll', onScrollGuard, true);
      vv?.removeEventListener('resize', onVVResize);
      frozenRef.current = false;
    };
  }, [step, currentStep, readRect]);

  // Measure tooltip's actual height so we can place it without overlap.
  useLayoutEffect(() => {
    if (!tooltipRef.current) return;
    const h = tooltipRef.current.offsetHeight;
    if (h && Math.abs(h - tooltipHeight) > 2) setTooltipHeight(h);
  });

  // Toggle a body-level class while highlighting the START SESSION chip so it can pulse via CSS.
  useEffect(() => {
    if (isStartSessionStep) {
      document.body.classList.add('onboarding-pulse-active');
    } else {
      document.body.classList.remove('onboarding-pulse-active');
    }
    return () => {
      document.body.classList.remove('onboarding-pulse-active');
    };
  }, [isStartSessionStep]);

  // For the START SESSION step, advance the tour (instead of closing) the moment the chip is clicked.
  // The chip's own onClick still navigates to /new-session, where Step 3 picks up.
  useEffect(() => {
    if (step?.selector !== '[data-tour="start-session"]') return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) return;
    const handler = () => {
      setStep(currentStep + 1);
    };
    el.addEventListener('click', handler, { once: true });
    return () => {
      el.removeEventListener('click', handler);
    };
  }, [step, currentStep, setStep, rect]);

  // For the TABLE ACTIONS step, advance the tour when the End Table popup
  // actually shows the Total Payout field — regardless of WHICH End Table
  // button the user tapped (there can be multiple table cards) or whether
  // the dialog opens directly on Total Payout vs an intro/reason picker
  // screen first. We watch the DOM continuously and advance the moment
  // [data-tour="end-table-cashout"] becomes visible anywhere on the page.
  useEffect(() => {
    if (!isTableActionsStep) return;
    let advanced = false;
    let pollTimer: number | null = null;

    const tryAdvance = () => {
      if (advanced) return;
      const target = getVisibleElement('[data-tour="end-table-cashout"]');
      if (!target) return;
      advanced = true;
      directionRef.current = 1;
      setStep(currentStep + 1);
      window.requestAnimationFrame(() => {
        readRect();
        window.requestAnimationFrame(() => setTooltipVisible(true));
      });
    };

    // Delegated click listener: catches a tap on ANY End Table button across
    // every table card (querySelector only matched the first one before).
    const onDocClick = (e: Event) => {
      const t = e.target as Element | null;
      if (!t) return;
      if (t.closest('[data-tour="end-table-button"]')) {
        directionRef.current = 1;
      }
    };
    document.addEventListener('click', onDocClick, true);

    // MutationObserver: fires the moment the dialog (or its inner cashout
    // section) mounts, regardless of which path the user took inside it.
    const observer = new MutationObserver(() => tryAdvance());
    observer.observe(document.body, { childList: true, subtree: true });

    // Safety poll covers Radix portal + animation timing on slow devices.
    const poll = () => {
      tryAdvance();
      if (!advanced) pollTimer = window.setTimeout(poll, 150);
    };
    pollTimer = window.setTimeout(poll, 150);

    return () => {
      document.removeEventListener('click', onDocClick, true);
      observer.disconnect();
      if (pollTimer) window.clearTimeout(pollTimer);
    };
  }, [isTableActionsStep, currentStep, setStep, getVisibleElement, readRect]);

  // For the END TABLE CASHOUT step, advance the tour as soon as a numeric value is entered.
  useEffect(() => {
    if (!isEndTableCashoutStep) return;
    const container = document.querySelector('[data-tour="end-table-cashout"]') as HTMLElement | null;
    if (!container) return;
    const input = container.querySelector('input') as HTMLInputElement | null;
    if (!input) return;
    const evaluate = () => {
      const raw = (input.value || '').replace(/,/g, '.').trim();
      if (raw === '') return;
      const v = parseFloat(raw);
      if (Number.isFinite(v) && v >= 0) {
        directionRef.current = 1;
        setStep(currentStep + 1);
      }
    };
    input.addEventListener('input', evaluate);
    input.addEventListener('change', evaluate);
    return () => {
      input.removeEventListener('input', evaluate);
      input.removeEventListener('change', evaluate);
    };
  }, [isEndTableCashoutStep, currentStep, setStep, rect]);

  // For the END TABLE CONFIRM step, advance the tour when the user taps End Table in the dialog.
  useEffect(() => {
    if (!isEndTableConfirmStep) return;
    const btn = document.querySelector('[data-tour="end-table-confirm"]') as HTMLElement | null;
    if (!btn) return;
    const handler = () => {
      directionRef.current = 1;
      setStep(currentStep + 1);
    };
    btn.addEventListener('click', handler, { once: true });
    return () => {
      btn.removeEventListener('click', handler);
    };
  }, [isEndTableConfirmStep, currentStep, setStep, rect]);

  const handleNext = () => {
    directionRef.current = 1;
    if (isLast) {
      onClose();
    } else {
      setStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    directionRef.current = -1;
    if (currentStep > 0) setStep(currentStep - 1);
  };

  const handleSkip = () => onClose();

  // ===== Menu mode: Welcome screen with 3 path-selection buttons =====
  if (isMenu) {
    const TOOLTIP_W = 320;
    const menuStyle: React.CSSProperties = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: TOOLTIP_W,
      maxWidth: 'calc(100vw - 24px)',
      pointerEvents: 'auto',
      boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6), 0 0 0 1px hsl(var(--primary) / 0.2)',
      fontFamily: "'Poppins', system-ui, sans-serif",
    };
    return (
      <div
        className="fixed inset-0 z-[100]"
        role="dialog"
        aria-modal="true"
        aria-label="Onboarding tour menu"
      >
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.72)' }}
          onClick={(e) => e.stopPropagation()}
        />
        <div
          className="absolute bg-card border border-primary/30 rounded-xl p-5"
          style={menuStyle}
        >
          <h3 className="text-lg font-bold text-primary mb-1.5 text-center">
            Welcome to Session Master
          </h3>
          <p className="text-sm text-foreground/80 leading-relaxed mb-4 text-center">
            Select a guide to begin your journey
          </p>

          <div className="flex flex-col gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
              onClick={() => onSelectPath?.('start-session')}
            >
              Start a Session Guide
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
              onClick={() => onSelectPath?.('home-guide')}
            >
              Home Page Guide
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
              onClick={() => onSelectPath?.('dashboard-guide')}
            >
              Dashboard Guide
            </Button>
          </div>

          <div className="flex items-center justify-start">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10" onClick={handleSkip}>
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!step) return null;

  // Compute spotlight box (with padding)
  const spotlight = rect
    ? {
        x: Math.max(0, rect.left - PADDING),
        y: Math.max(0, rect.top - PADDING),
        w: rect.width + PADDING * 2,
        h: rect.height + PADDING * 2,
      }
    : null;

  const isCircleStep = !!step.circle;
  const CIRCLE_PADDING = 8;
  const circle = rect && isCircleStep
    ? {
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2,
        r: Math.max(rect.width, rect.height) / 2 + CIRCLE_PADDING,
      }
    : null;

  // Tooltip position: pick the side (above/below) with more available room,
  // size width responsively, and clamp into viewport so it never runs off-screen
  // or overlaps the spotlighted element.
  // Width: never wider than viewport - margins, and never wider than 90vw.
  const tooltipWidth = Math.max(
    Math.min(TOOLTIP_MIN_WIDTH, viewport.w - VIEWPORT_MARGIN * 2),
    Math.min(TOOLTIP_MAX_WIDTH, viewport.w - VIEWPORT_MARGIN * 2, viewport.w * 0.9)
  );
  let tooltipStyle: React.CSSProperties;
  if (!spotlight) {
    tooltipStyle = {
      top: Math.max(VIEWPORT_MARGIN, viewport.h / 2 - tooltipHeight / 2),
      left: Math.max(VIEWPORT_MARGIN, viewport.w / 2 - tooltipWidth / 2),
      width: tooltipWidth,
    };
  } else {
    const gap = step.compact ? 8 : TOOLTIP_GAP;
    const required = tooltipHeight + gap + VIEWPORT_MARGIN;
    const spaceBelow = viewport.h - (spotlight.y + spotlight.h);
    const spaceAbove = spotlight.y;
    let top: number;
    // RULE: Tooltip ALWAYS sits below the spotlight, with a clean gap and zero
    // overlap. Only flip ABOVE when there is genuinely no room below AND above
    // has meaningfully more space (e.g. spotlight near the bottom edge).
    let placeBelow = spaceBelow >= required || spaceBelow >= spaceAbove;
    if (step.placement === 'above') placeBelow = false;
    else if (step.placement === 'below') placeBelow = true;
    if (placeBelow) {
      // Anchor strictly below the spotlight bottom edge. Do NOT clamp upward —
      // overlapping the spotlight is forbidden. If the tooltip extends past the
      // viewport bottom, the 90vw width keeps it readable; users can always see
      // the highlighted element clearly.
      top = spotlight.y + spotlight.h + gap;
    } else {
      top = Math.max(VIEWPORT_MARGIN, spotlight.y - gap - tooltipHeight);
    }
    let left = spotlight.x + spotlight.w / 2 - tooltipWidth / 2;
    left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(left, viewport.w - tooltipWidth - VIEWPORT_MARGIN)
    );
    tooltipStyle = { top, left, width: tooltipWidth };
  }

  // Interactive steps render dim "bands" around the spotlight (instead of a full SVG mask),
  // so the hole over the highlighted element lets clicks pass through to the underlying UI.
  const stepIsInteractive = !!step.interactive;
  const interactive = stepIsInteractive && !!rect;

  // Bands for circular spotlight
  const circleBands = interactive && circle
    ? {
        top: { left: 0, top: 0, width: viewport.w, height: Math.max(0, circle.cy - circle.r) },
        bottom: {
          left: 0,
          top: circle.cy + circle.r,
          width: viewport.w,
          height: Math.max(0, viewport.h - (circle.cy + circle.r)),
        },
        left: {
          left: 0,
          top: Math.max(0, circle.cy - circle.r),
          width: Math.max(0, circle.cx - circle.r),
          height: Math.min(viewport.h, circle.r * 2),
        },
        right: {
          left: circle.cx + circle.r,
          top: Math.max(0, circle.cy - circle.r),
          width: Math.max(0, viewport.w - (circle.cx + circle.r)),
          height: Math.min(viewport.h, circle.r * 2),
        },
      }
    : null;

  // Bands for rectangular spotlight (interactive non-circle steps)
  const rectBands = interactive && !circle && spotlight
    ? {
        top: { left: 0, top: 0, width: viewport.w, height: Math.max(0, spotlight.y) },
        bottom: {
          left: 0,
          top: spotlight.y + spotlight.h,
          width: viewport.w,
          height: Math.max(0, viewport.h - (spotlight.y + spotlight.h)),
        },
        left: {
          left: 0,
          top: spotlight.y,
          width: Math.max(0, spotlight.x),
          height: spotlight.h,
        },
        right: {
          left: spotlight.x + spotlight.w,
          top: spotlight.y,
          width: Math.max(0, viewport.w - (spotlight.x + spotlight.w)),
          height: spotlight.h,
        },
      }
    : null;

  const bands = circleBands || rectBands;

  return (
    <div
      className={`fixed inset-0 ${stepInsideDialog ? 'z-[120]' : 'z-[100]'} pointer-events-none`}
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding tour"
    >
      {/* Full-screen click blocker for non-interactive steps. Skip when the
          target is inside a Radix Dialog — the dialog's own overlay handles
          dimming and click-blocking. */}
      {!stepIsInteractive && !stepInsideDialog && (
        <div
          className="absolute inset-0"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => {
            const t = e.target as Element | null;
            if (t && t.closest('[data-tour-allow="true"]')) return;
            e.stopPropagation();
          }}
        />
      )}

      {/* Dim bands for the interactive spotlight (circle or rect).
          Skipped when the spotlight target lives inside a Radix Dialog so the
          dialog content stays visible — the dialog's own overlay provides
          the dimming. */}
      {interactive && bands && !stepInsideDialog && (
        <>
          {(['top', 'bottom', 'left', 'right'] as const).map((k) => {
            const b = bands[k];
            if (b.width <= 0 || b.height <= 0) return null;
            return (
              <div
                key={k}
                className="absolute"
                style={{
                  left: b.left,
                  top: b.top,
                  width: b.width,
                  height: b.height,
                  background: 'rgba(0,0,0,0.72)',
                  pointerEvents: 'auto',
                  transition: 'none',
                }}
                onClick={(e) => {
                  const t = e.target as Element | null;
                  if (t && t.closest('[data-tour-allow="true"]')) return;
                  e.stopPropagation();
                }}
              />
            );
          })}
        </>
      )}

      {/* SVG visual layer: spotlight cutout (non-interactive only) + gold stroke */}
      <svg
        className="absolute inset-0 w-full h-full"
        width={viewport.w}
        height={viewport.h}
        style={{ pointerEvents: 'none' }}
      >
        {!stepIsInteractive && (
          <>
            <defs>
              <mask id="onboarding-spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {spotlight ? (
                  <rect
                    x={spotlight.x}
                    y={spotlight.y}
                    width={spotlight.w}
                    height={spotlight.h}
                    rx={RADIUS}
                    ry={RADIUS}
                    fill="black"
                  />
                ) : null}
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.72)"
              mask="url(#onboarding-spotlight-mask)"
              style={{ transition: 'none' }}
            />
          </>
        )}

        {/* Animated gold stroke around spotlight */}
        {circle ? (
          <circle
            cx={circle.cx}
            cy={circle.cy}
            r={circle.r}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            opacity="0.85"
            style={{
              filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.7))',
              transition: 'none',
            }}
          />
        ) : spotlight ? (
          <rect
            x={spotlight.x}
            y={spotlight.y}
            width={spotlight.w}
            height={spotlight.h}
            rx={RADIUS}
            ry={RADIUS}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            opacity="0.85"
            style={{
              filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.7))',
              transition: 'none',
            }}
          />
        ) : null}
      </svg>

      {/* Pulsing tap-hand overlay (Start Session chip + Stakes buy-in field) */}
      {showTapHand && rect && (() => {
        // For the stakes step, the spotlight wraps Buy-in + Blinds. Anchor the hand on
        // the Buy-in input specifically when we can find it; otherwise fall back to the
        // top portion of the highlighted area.
        let cx = rect.left + rect.width / 2;
        let cy = rect.top + rect.height / 2;
        if (isStakesStep) {
          const input = document.querySelector(
            '[data-tour="stakes"] input'
          ) as HTMLElement | null;
          if (input) {
            const ir = input.getBoundingClientRect();
            cx = ir.left + ir.width / 2;
            cy = ir.top + ir.height / 2;
          }
        }
        return (
          <div
            className="absolute pointer-events-none tour-tap-hand"
            style={{
              left: cx,
              top: cy,
              zIndex: 20,
            }}
            aria-hidden="true"
          >
            <Hand className="w-12 h-12 text-primary drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
          </div>
        );
      })()}

      {/* Looping tap-hand over the End Table button (Active Tables step 2) */}
      {isTableActionsStep && rect && (() => {
        const btn = document.querySelector('[data-tour="end-table-button"]') as HTMLElement | null;
        if (!btn) return null;
        const br = btn.getBoundingClientRect();
        const cx = br.left + br.width / 2;
        const cy = br.top + br.height / 2;
        return (
          <div
            className="absolute pointer-events-none tour-tap-hand"
            style={{ left: cx, top: cy, zIndex: 20 }}
            aria-hidden="true"
          >
            <Hand className="w-12 h-12 text-primary drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
          </div>
        );
      })()}

      {/* Looping tap-hand over the End Table confirm button (inside dialog) */}
      {(isEndTableConfirmStep || isEndTableCashoutStep) && rect && (() => {
        let cx = rect.left + rect.width / 2;
        let cy = rect.top + rect.height / 2;
        if (isEndTableCashoutStep) {
          const input = document.querySelector(
            '[data-tour="end-table-cashout"] input'
          ) as HTMLElement | null;
          if (input) {
            const ir = input.getBoundingClientRect();
            cx = ir.left + ir.width / 2;
            cy = ir.top + ir.height / 2;
          }
        }
        return (
          <div
            className="absolute pointer-events-none tour-tap-hand"
            style={{ left: cx, top: cy, zIndex: 20 }}
            aria-hidden="true"
          >
            <Hand className="w-12 h-12 text-primary drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
          </div>
        );
      })()}

      {/* Tooltip card */}
      {(!stepIsInteractive || rect) && (
        <div
          ref={tooltipRef}
          className={`absolute bg-card border border-primary/30 rounded-xl shadow-2xl ${step.compact ? 'p-3 sm:p-3.5' : 'p-4 sm:p-5'}`}
          style={{
            ...tooltipStyle,
            maxWidth: '90vw',
            pointerEvents: tooltipVisible ? 'auto' : 'none',
            opacity: tooltipVisible ? 1 : 0,
            zIndex: 10,
            transition: 'opacity 200ms ease-out',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6), 0 0 0 1px hsl(var(--primary) / 0.2)',
            fontFamily: "'Poppins', system-ui, sans-serif",
          }}
        >
        <h3 className={`text-base sm:text-lg font-bold text-primary text-center ${step.compact ? 'mb-1' : 'mb-1.5'}`}>{step.title}</h3>
        <p className={`text-sm sm:text-[0.95rem] text-foreground/80 leading-relaxed text-center ${step.compact ? 'mb-2' : 'mb-4'}`}>
          {(() => {
            const renderHighlighted = (text: string) => {
              const parts = text.split(/(\*\*[^*]+\*\*)/g);
              return parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <span key={i} className="text-primary font-semibold">
                      {part.slice(2, -2)}
                    </span>
                  );
                }
                return <span key={i}>{part}</span>;
              });
            };
            const idx = step.body.indexOf('! ');
            if (idx === -1) return renderHighlighted(step.body);
            const first = step.body.slice(0, idx + 1);
            const rest = step.body.slice(idx + 2);
            return (
              <>
                {renderHighlighted(first)}
                <br />
                {renderHighlighted(rest)}
              </>
            );
          })()}
        </p>

        <div className={`flex flex-col ${step.compact ? 'gap-2' : 'gap-3'}`}>
          {/* Buttons row */}
          <div className="flex items-center justify-between gap-2">
            {hidePreviousButton ? (
              <span />
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={isFirst ? () => onReturnToMenu?.() : handlePrev}
              >
                Previous
              </Button>
            )}
            <div className="flex items-center gap-2">
              {step?.selector === '[data-tour="game-setup"]' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground hover:bg-transparent"
                >
                  Skip
                </Button>
              )}
              {!hideNextButton && (
                <Button size="sm" onClick={handleNext} disabled={nextDisabled} aria-disabled={nextDisabled}>
                  {isLast ? 'Done' : 'Next'}
                </Button>
              )}
            </div>
          </div>

          {/* Step indicator row */}
          <div className="flex items-center justify-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/40'
                }`}
              />
            ))}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
