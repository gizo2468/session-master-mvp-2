import React, { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';

export interface TourStep {
  selector: string;
  title: string;
  body: string;
}

interface OnboardingTourProps {
  steps: TourStep[];
  onClose: () => void;
}

const PADDING = 10;
const RADIUS = 14;
const TOOLTIP_GAP = 16;
const TOOLTIP_WIDTH = 300;

export default function OnboardingTour({ steps, onClose }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 0,
    h: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const measureTimer = useRef<number | null>(null);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    // Scroll into view first if off-screen
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.top < 60 || r.bottom > vh - 60) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Re-measure after scroll settles
      window.setTimeout(() => {
        const r2 = el.getBoundingClientRect();
        setRect(r2);
      }, 350);
      return;
    }
    setRect(r);
  }, [step]);

  // Re-measure on step change with a tiny delay to allow paint
  useLayoutEffect(() => {
    setTooltipVisible(false);
    if (measureTimer.current) window.clearTimeout(measureTimer.current);
    measureTimer.current = window.setTimeout(() => {
      measure();
      // Trigger fade-in
      window.requestAnimationFrame(() => setTooltipVisible(true));
    }, 50);
    return () => {
      if (measureTimer.current) window.clearTimeout(measureTimer.current);
    };
  }, [currentStep, measure]);

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

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleSkip = () => onClose();

  const isFirst = currentStep === 0;

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

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding tour"
      // Block pointer events from reaching elements below; tooltip buttons re-enable themselves.
      onClick={(e) => e.stopPropagation()}
    >
      {/* SVG dark backdrop with spotlight cutout */}
      <svg
        className="absolute inset-0 w-full h-full"
        width={viewport.w}
        height={viewport.h}
        style={{ pointerEvents: 'auto' }}
      >
        <defs>
          <mask id="onboarding-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.x}
                y={spotlight.y}
                width={spotlight.w}
                height={spotlight.h}
                rx={RADIUS}
                ry={RADIUS}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.72)"
          mask="url(#onboarding-spotlight-mask)"
          style={{
            transition: 'all 300ms ease',
          }}
        />
        {/* Animated gold stroke around spotlight */}
        {spotlight && (
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
        )}
      </svg>

      {/* Tooltip card */}
      <div
        className="absolute bg-card border border-primary/30 rounded-xl shadow-2xl p-4 transition-all duration-300 ease-out"
        style={{
          ...tooltipStyle,
          pointerEvents: 'auto',
          opacity: tooltipVisible ? 1 : 0,
          transform: tooltipVisible ? 'translateY(0)' : 'translateY(8px)',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6), 0 0 0 1px hsl(var(--primary) / 0.2)',
        }}
      >
        <h3 className="text-base font-bold text-primary mb-1.5">{step.title}</h3>
        <p className="text-sm text-foreground/90 leading-relaxed mb-4">{step.body}</p>

        <div className="flex items-center justify-between gap-2">
          {/* Step indicator dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/40'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip
            </Button>
            {!isFirst && (
              <Button variant="outline" size="sm" onClick={handlePrev}>
                Previous
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {isLast ? 'Done' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
