import React, { useLayoutEffect, useRef, useState } from 'react';

type FloatingCardSelectorProps = {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
  offset?: number;               // default 8
  width?: number;                // default 320
  placement?: 'bottom' | 'top';  // default 'bottom'
  zIndex?: number;               // default 1000
  children: React.ReactNode;
};

const FloatingCardSelector: React.FC<FloatingCardSelectorProps> = ({
  open,
  onClose,
  anchorRef,
  offset = 8,
  width = 320,
  placement = 'bottom',
  zIndex = 1000,
  children
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, place: placement as 'bottom' | 'top' });

  const compute = () => {
    const anchor = anchorRef.current as HTMLElement | null;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const panelW = panelRef.current?.offsetWidth || width;
    const panelH = panelRef.current?.offsetHeight || 0;
    const margin = 8;

    let left = rect.left + rect.width / 2;
    let top = rect.bottom + offset;
    let place: 'bottom' | 'top' = 'bottom';

    // Flip to top if bottom overflows
    if (rect.bottom + offset + panelH > window.innerHeight - margin) {
      top = rect.top - offset; // position above; we'll translateY(-100%) in style
      place = 'top';
    }

    // Clamp within viewport horizontally
    const half = panelW / 2;
    left = Math.min(Math.max(left, margin + half), window.innerWidth - margin - half);

    setPos({ top, left, place });
  };

  useLayoutEffect(() => {
    if (!open) return;
    compute();

    let raf = 0;
    const loop = () => {
      compute();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => compute();
    window.addEventListener('resize', onResize);
    // capture scroll on all ancestors
    window.addEventListener('scroll', onResize, true);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Transparent overlay to catch outside clicks/taps */}
      <div
        className="fixed inset-0"
        style={{ zIndex }}
        onPointerDown={onClose}
        onTouchStart={(e) => { e.preventDefault(); onClose(); }}
      />
      {/* Floating panel anchored to the button */}
      <div
        className="fixed"
        style={{
          top: pos.top,
          left: pos.left,
          transform: `translateX(-50%) ${pos.place === 'top' ? 'translateY(-100%)' : ''}`,
          zIndex: zIndex + 1
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div
          ref={panelRef}
          className="w-[320px] p-4 rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default FloatingCardSelector;
