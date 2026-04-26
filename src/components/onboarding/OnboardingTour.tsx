import React, { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import { Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TourStep {
  selector: string;
  title: string;
  body: string;
  /** When true, the spotlight is click-through and underlying UI stays interactive. */
  interactive?: boolean;
  /** When true, render a circular spotlight instead of a rounded rectangle. */
  circle?: boolean;
}

interface OnboardingTourProps {
  steps: TourStep[];
  onClose: () => void;
  /** Optional controlled step index. If omitted, the component manages it internally. */
  currentStep?: number;
  /** Called whenever the active step changes (Next / Previous / programmatic advance). */
  onStepChange?: (next: number) => void;
}

const PADDING = 10;
const RADIUS = 14;
const TOOLTIP_GAP = 16;
const TOOLTIP_WIDTH = 300;

export default function OnboardingTour({
  steps,
  onClose,
  currentStep: controlledStep,
  onStepChange,
}: OnboardingTourProps) {
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
  const measureTimer = useRef<number | null>(null);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;
  const isStartSessionStep = step?.selector === '[data-tour="start-session"]';

  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.top < 60 || r.bottom > vh - 60) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => {
        const r2 = el.getBoundingClientRect();
        setRect(r2);
      }, 350);
      return;
    }
    setRect(r);
  }, [step]);

  // Re-measure on step change with a tiny delay to allow paint, plus retries for elements
  // that mount after navigation (e.g. SessionForm fields).
  useLayoutEffect(() => {
    setTooltipVisible(false);
    if (measureTimer.current) window.clearTimeout(measureTimer.current);

    let attempts = 0;
    const tryMeasure = () => {
      const el = step ? (document.querySelector(step.selector) as HTMLElement | null) : null;
      if (!el && attempts < 20) {
        attempts++;
        measureTimer.current = window.setTimeout(tryMeasure, 100);
        return;
      }
      measure();
      window.requestAnimationFrame(() => setTooltipVisible(true));
    };
    measureTimer.current = window.setTimeout(tryMeasure, 50);

    return () => {
      if (measureTimer.current) window.clearTimeout(measureTimer.current);
    };
  }, [currentStep, measure, step]);

  // Resize / scroll listeners
  useEffect(() => {
    const onResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      measure();
    };
    const onScroll = () => measure();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [measure]);

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

  // Tooltip position: prefer below; fall back to above; if no rect, center
  let tooltipStyle: React.CSSProperties;
  if (!spotlight) {
    tooltipStyle = {
      top: viewport.h / 2 - 80,
      left: viewport.w / 2 - TOOLTIP_WIDTH / 2,
      width: TOOLTIP_WIDTH,
    };
  } else {
    const spaceBelow = viewport.h - (spotlight.y + spotlight.h);
    const showBelow = spaceBelow > 180;
    const top = showBelow
      ? spotlight.y + spotlight.h + TOOLTIP_GAP
      : Math.max(16, spotlight.y - TOOLTIP_GAP - 180);
    let left = spotlight.x + spotlight.w / 2 - TOOLTIP_WIDTH / 2;
    left = Math.max(12, Math.min(left, viewport.w - TOOLTIP_WIDTH - 12));
    tooltipStyle = { top, left, width: TOOLTIP_WIDTH };
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
                  transition: 'all 300ms ease',
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
              style={{ transition: 'all 300ms ease' }}
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
              transition: 'all 300ms ease',
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
              transition: 'all 300ms ease',
            }}
          />
        ) : null}
      </svg>

      {/* Pulsing tap-hand overlay centered on the START SESSION chip (Step 2 only) */}
      {isStartSessionStep && rect && (
        <div
          className="absolute pointer-events-none tour-tap-hand"
          style={{
            left: rect.left + rect.width / 2,
            top: rect.top + rect.height / 2,
            zIndex: 2,
          }}
          aria-hidden="true"
        >
          <Hand className="w-12 h-12 text-primary drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
        </div>
      )}

      {/* Tooltip card */}
      <div
        className="absolute bg-card border border-primary/30 rounded-xl shadow-2xl p-4 transition-all duration-300 ease-out"
        style={{
          ...tooltipStyle,
          pointerEvents: 'auto',
          opacity: tooltipVisible ? 1 : 0,
          transform: tooltipVisible ? 'translateY(0)' : 'translateY(8px)',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6), 0 0 0 1px hsl(var(--primary) / 0.2)',
          fontFamily: "'Poppins', system-ui, sans-serif",
        }}
      >
        <h3 className="text-base font-bold text-primary mb-1.5 text-center">{step.title}</h3>
        <p className="text-sm text-foreground/80 leading-relaxed mb-4 text-center">
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
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip
            </Button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <Button variant="outline" size="sm" onClick={handlePrev}>
                  Previous
                </Button>
              )}
              {!isStartSessionStep && (
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
