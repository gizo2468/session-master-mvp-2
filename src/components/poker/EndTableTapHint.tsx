import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Hand } from 'lucide-react';

/**
 * Renders the existing tour tap-hand animation briefly over the first
 * "End Table" button when a `sm:show-end-table-hint` window event fires.
 * Purely visual — pointer-events-none, never triggers the button.
 */
export default function EndTableTapHint() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let hideTimer: number | undefined;
    let rafId: number | undefined;
    let target: HTMLElement | null = null;

    const measure = () => {
      if (!target || !document.body.contains(target)) {
        setPos(null);
        return;
      }
      const r = target.getBoundingClientRect();
      setPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    };

    const onShow = () => {
      // Wait one frame so any in-flight scroll/layout settles.
      rafId = window.requestAnimationFrame(() => {
        target = document.querySelector<HTMLElement>(
          '[data-tour="end-table-button"]'
        );
        if (!target) return;
        measure();
        window.addEventListener('scroll', measure, true);
        window.addEventListener('resize', measure);
        if (hideTimer) window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(() => {
          setPos(null);
          window.removeEventListener('scroll', measure, true);
          window.removeEventListener('resize', measure);
          target = null;
        }, 3200);
      });
    };

    window.addEventListener('sm:show-end-table-hint', onShow);
    return () => {
      window.removeEventListener('sm:show-end-table-hint', onShow);
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
      if (hideTimer) window.clearTimeout(hideTimer);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  if (!pos || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed pointer-events-none tour-tap-hand"
      style={{ left: pos.x, top: pos.y, zIndex: 60 }}
      aria-hidden="true"
    >
      <Hand className="w-12 h-12 text-primary drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
    </div>,
    document.body
  );
}
