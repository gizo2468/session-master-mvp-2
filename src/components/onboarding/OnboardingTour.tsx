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

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;
  const isStartSessionStep = step?.selector === '[data-tour="start-session"]';
  const isStakesStep = step?.selector === '[data-tour="stakes"]';
  const isSubmitSessionStep = step?.selector === '[data-tour="submit-session"]';
  const isGameSetupStep = step?.selector === '[data-tour="game-setup"]';
  const showTapHand = isStartSessionStep || isStakesStep || isSubmitSessionStep;
  const hideNextButton = isStartSessionStep || isSubmitSessionStep;
  const hidePreviousButton = isGameSetupStep;

  // Lightweight rect read — no scroll-into-view, no state churn if unchanged.
  const readRect = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
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
  }, [step]);

  // Step-change effect: run prepare hook, then poll for the element until found
  // (or auto-skip after retries). NO smooth scrollIntoView — that causes the
  // spotlight/tooltip to drift visibly. We snap directly to the rect instead.
  useLayoutEffect(() => {
    setTooltipVisible(false);
    hadRectRef.current = false;
    if (measureTimer.current) window.clearTimeout(measureTimer.current);

    let cancelled = false;
    let attempts = 0;

    const focusAndMeasure = () => {
      if (cancelled || !step) return;
      const el = document.querySelector(step.selector) as HTMLElement | null;
      if (!el) {
        if (attempts >= 25) {
          if (!isLast) setStep(currentStep + 1);
          return;
        }
        attempts++;
        measureTimer.current = window.setTimeout(focusAndMeasure, 100);
        return;
      }
      readRect();
      // Two rAFs: ensure layout settled (esp. after prepare()) before reveal.
      window.requestAnimationFrame(() => {
        if (cancelled) return;
        readRect();
        window.requestAnimationFrame(() => !cancelled && setTooltipVisible(true));
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
  }, [currentStep, step, readRect, setStep, isLast]);

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
      readRect();
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      rafId.current = window.requestAnimationFrame(tick);
    };
    const onResize = () => {
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

    // Allow scroll/touch only inside the tooltip card; block everything else.
    const isInsideTooltip = (target: EventTarget | null) =>
      target instanceof Node && tooltipRef.current?.contains(target);
    const blockEvent = (e: Event) => {
      if (isInsideTooltip(e.target)) return;
      e.preventDefault();
    };
    const blockKeys = (e: KeyboardEvent) => {
      if (isInsideTooltip(e.target)) return;
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

  // Observe size changes on the spotlighted element (e.g. accordion expanding)
  // so the spotlight re-measures immediately instead of waiting for scroll/resize.
  useEffect(() => {
    if (!step || typeof ResizeObserver === 'undefined') return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) return;
    const ro = new ResizeObserver(() => readRect());
    ro.observe(el);
    return () => ro.disconnect();
  }, [step, readRect, currentStep]);

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

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
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
            What would you like to learn?
          </p>

          <div className="flex flex-col gap-2 mb-4">
            <Button
              variant="poker"
              size="sm"
              className="w-full"
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
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip
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
    const required = tooltipHeight + TOOLTIP_GAP + VIEWPORT_MARGIN;
    const spaceBelow = viewport.h - (spotlight.y + spotlight.h);
    const spaceAbove = spotlight.y;
    let top: number;
    // RULE: Tooltip ALWAYS sits below the spotlight, with a clean gap and zero
    // overlap. Only flip ABOVE when there is genuinely no room below AND above
    // has meaningfully more space (e.g. spotlight near the bottom edge).
    const placeBelow = spaceBelow >= required || spaceBelow >= spaceAbove;
    if (placeBelow) {
      // Anchor strictly below the spotlight bottom edge. Do NOT clamp upward —
      // overlapping the spotlight is forbidden. If the tooltip extends past the
      // viewport bottom, the 90vw width keeps it readable; users can always see
      // the highlighted element clearly.
      top = spotlight.y + spotlight.h + TOOLTIP_GAP;
    } else {
      top = Math.max(VIEWPORT_MARGIN, spotlight.y - TOOLTIP_GAP - tooltipHeight);
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
  const interactive = !!step.interactive && !!rect;

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
      className="fixed inset-0 z-[100] pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding tour"
    >
      {/* Full-screen click blocker for non-interactive steps */}
      {!interactive && (
        <div
          className="absolute inset-0"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Dim bands for the interactive spotlight (circle or rect).
          The hole in the middle has no element so clicks pass through. */}
      {interactive && bands && (
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
                onClick={(e) => e.stopPropagation()}
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
        {!interactive && (
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

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="absolute bg-card border border-primary/30 rounded-xl shadow-2xl p-4 sm:p-5"
        style={{
          ...tooltipStyle,
          maxWidth: '90vw',
          pointerEvents: 'auto',
          opacity: tooltipVisible ? 1 : 0,
          zIndex: 10,
          // Snap position instantly; only fade in on reveal so the tooltip
          // never visibly slides between updates.
          transition: 'opacity 200ms ease-out',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6), 0 0 0 1px hsl(var(--primary) / 0.2)',
          fontFamily: "'Poppins', system-ui, sans-serif",
        }}
      >
        <h3 className="text-base sm:text-lg font-bold text-primary mb-1.5 text-center">{step.title}</h3>
        <p className="text-sm sm:text-[0.95rem] text-foreground/80 leading-relaxed mb-4 text-center">
          {(() => {
            const idx = step.body.indexOf('! ');
            if (idx === -1) return step.body;
            const first = step.body.slice(0, idx + 1);
            const rest = step.body.slice(idx + 2);
            return (
              <>
                {first}
                <br />
                {rest}
              </>
            );
          })()}
        </p>

        <div className="flex flex-col gap-3">
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
              {!hideNextButton && (
                <Button size="sm" onClick={handleNext}>
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
    </div>
  );
}
